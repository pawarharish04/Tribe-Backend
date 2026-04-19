import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import { isToxic } from '../services/comprehendService';
import { generateIcebreakers, generateConversationRescue } from '../services/wingmanService';

dotenv.config();

const PORT = Number(process.env.SOCKET_PORT ?? 4000);

// ─── CORS allowlist ───────────────────────────────────────────────────────────
// Set CORS_ORIGIN in .env as a comma-separated list of allowed origins:
//   CORS_ORIGIN=https://app.example.com,https://www.example.com
// Falls back to localhost:3000 in non-production environments.
const ALLOWED_ORIGINS: Set<string> = new Set(
    process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
        : process.env.NODE_ENV === 'production'
            ? [] // no fallback in production — must be explicitly set
            : ['http://localhost:3000'],
);

if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.size === 0) {
    throw new Error(
        '[socket/server] CORS_ORIGIN environment variable is not set. ' +
        'Provide a comma-separated list of allowed origins (e.g. https://app.example.com).',
    );
}

console.log(`[socket] CORS allowed origins: ${[...ALLOWED_ORIGINS].join(', ')}`);


if (!process.env.JWT_SECRET) {
    throw new Error(
        '[socket/server] JWT_SECRET environment variable is not set. ' +
        'Set it in your .env file and restart the server.',
    );
}

const JWT_SECRET = process.env.JWT_SECRET;

// Dedicated Prisma instance for socket process
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const server = http.createServer();

const io = new Server(server, {
    cors: {
        // Socket.IO calls this for every upgrade request.
        // Return the origin if it's in the allowlist, deny otherwise.
        origin: (requestOrigin, callback) => {
            // Allow requests with no Origin header (e.g. same-origin / server-to-server)
            if (!requestOrigin || ALLOWED_ORIGINS.has(requestOrigin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin '${requestOrigin}' is not allowed.`));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// ─── Online Presence Map ─────────────────────────────────────────────────────
// userId → socketId (single session per user, last-write-wins)
const onlineUsers = new Map<string, string>();


// ─── STEP 1: JWT Auth Middleware ─────────────────────────────────────────────
io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Unauthorized'));

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        (socket as any).userId = decoded.userId;
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});

// ─── Connections ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    const userId: string = (socket as any).userId;
    console.log(`[socket] Connected: ${socket.id} (user: ${userId})`);

    // Track presence
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit('user_online', { userId });


    // ─── STEP 2: Validate match membership before join ────────────────────────
    socket.on('join_match', async (matchId: string) => {
        const match = await prisma.matchUnlock.findFirst({
            where: {
                id: matchId,
                OR: [{ user1Id: userId }, { user2Id: userId }]
            }
        });

        if (!match) {
            socket.emit('error', 'Not authorized for this match');
            console.log(`[socket] ${userId} rejected from match:${matchId}`);
            return;
        }

        socket.join(`match:${matchId}`);
        console.log(`[socket] ${userId} joined match:${matchId}`);

        // Tell the joiner whether their partner is currently online
        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
        socket.emit('presence_status', {
            userId: partnerId,
            online: onlineUsers.has(partnerId),
        });
    });


    // ─── STEP 3: Server-side DB write — never trust client senderId ───────────
    socket.on('send_message', async (payload: {
        matchId: string;
        content: string;
        clientTempId?: string; // used to resolve optimistic UI on client
    }) => {
        const { matchId, content, clientTempId } = payload;

        if (!content || content.length > 1000) return;

        try {
            const toxic = await isToxic(content);
            if (toxic) {
                socket.emit('error', 'Message blocked due to inappropriate content (hate speech, harassment, etc).');
                return;
            }
        } catch (err) {
            console.error("Toxicity check failed", err);
        }

        // Re-validate membership
        const match = await prisma.matchUnlock.findFirst({
            where: {
                id: matchId,
                OR: [{ user1Id: userId }, { user2Id: userId }]
            }
        });

        if (!match) {
            console.log(`[socket] ${userId} blocked send to match:${matchId}`);
            return;
        }

        // Save to DB — senderId comes from verified JWT, not client payload
        const message = await prisma.message.create({
            data: { matchId, senderId: userId, content }
        });

        console.log(`[socket] Saved msg ${message.id} → match:${matchId}`);

        // Broadcast to everyone in room (including sender for optimistic resolution)
        io.to(`match:${matchId}`).emit('new_message', {
            ...message,
            createdAt: message.createdAt.toISOString(),
            clientTempId: clientTempId ?? null,
        });
    });

    // ─── STEP 4: AI Wingman Command ──────────────────────────────────────────
    socket.on('wingman', async (payload: { matchId: string; action?: string }) => {
        const { matchId, action } = payload;
        if (!matchId) return;

        const match = await prisma.matchUnlock.findFirst({
            where: { id: matchId, OR: [{ user1Id: userId }, { user2Id: userId }] }
        });
        if (!match) return;

        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;

        const [userA, userB] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    interests: { select: { interest: { select: { name: true } } }, take: 10 },
                    interestPosts: { select: { caption: true, interest: { select: { name: true } } }, take: 5 }
                }
            }),
            prisma.user.findUnique({
                where: { id: partnerId },
                include: {
                    interests: { select: { interest: { select: { name: true } } }, take: 10 },
                    interestPosts: { select: { caption: true, interest: { select: { name: true } } }, take: 5 }
                }
            })
        ]);

        if (!userA || !userB) return;

        const profileA = {
            name: userA.name || 'Anonymous',
            bio: userA.bio,
            interests: userA.interests.map((ui: any) => ui.interest.name),
            recentPosts: userA.interestPosts.map((p: any) => ({ caption: p.caption, interestName: p.interest?.name || '' }))
        };
        const profileB = {
            name: userB.name || 'Anonymous',
            bio: userB.bio,
            interests: userB.interests.map((ui: any) => ui.interest.name),
            recentPosts: userB.interestPosts.map((p: any) => ({ caption: p.caption, interestName: p.interest?.name || '' }))
        };

        let suggestions: string[] = [];

        if (action === 'rescue') {
            const messages = await prisma.message.findMany({
                where: { matchId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { sender: { select: { name: true } } }
            });
            const recentMsgs = messages.reverse().map(m => ({ sender: m.sender.name || 'User', content: m.content }));
            suggestions = await generateConversationRescue(profileA, profileB, recentMsgs);
        } else {
            suggestions = await generateIcebreakers(profileA, profileB);
        }

        socket.emit('wingman_response', {
            matchId,
            suggestions,
            partnerName: profileB.name
        });

        console.log(`[socket] Wingman activated for ${userId} in match:${matchId}`);
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_offline', { userId });
        console.log(`[socket] Disconnected: ${socket.id}`);
    });


    // ─── STEP 5: Typing Indicators ───────────────────────────────────────────
    socket.on('typing_start', (matchId: string) => {
        socket.to(`match:${matchId}`).emit('typing_start', { userId });
    });

    socket.on('typing_stop', (matchId: string) => {
        socket.to(`match:${matchId}`).emit('typing_stop', { userId });
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
    console.log(`WebSocket server running on 0.0.0.0:${PORT}`);
});
