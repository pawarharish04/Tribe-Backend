import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.SOCKET_PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// Dedicated Prisma instance for socket process
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const server = http.createServer();

const io = new Server(server, {
    cors: { origin: '*' },
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

    socket.on('disconnect', () => {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_offline', { userId });
        console.log(`[socket] Disconnected: ${socket.id}`);
    });


    // ─── STEP 4: Typing Indicators ───────────────────────────────────────────
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
