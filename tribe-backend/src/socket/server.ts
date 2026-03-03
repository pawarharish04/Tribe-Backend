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
        console.log(`[socket] Disconnected: ${socket.id}`);
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
    console.log(`WebSocket server running on 0.0.0.0:${PORT}`);
});
