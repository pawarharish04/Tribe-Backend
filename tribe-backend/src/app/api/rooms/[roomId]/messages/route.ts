import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../../lib/auth';

// GET /api/rooms/[roomId]/messages — fetch messages in a room
export async function GET(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { roomId } = await params;

        // Verify room exists and user is a member
        const membership = await prisma.roomMembership.findUnique({
            where: { roomId_userId: { roomId, userId } }
        });
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden. Join the room first.' }, { status: 403 });
        }

        const messages = await prisma.roomMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                senderId: true,
                content: true,
                createdAt: true,
                sender: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json({ messages }, { status: 200 });

    } catch (error) {
        console.error('Room Messages GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/rooms/[roomId]/messages — send a message in a room
export async function POST(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { roomId } = await params;

        // Verify membership
        const membership = await prisma.roomMembership.findUnique({
            where: { roomId_userId: { roomId, userId } }
        });
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden. Join the room first.' }, { status: 403 });
        }

        const { content } = await req.json();
        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Empty message.' }, { status: 400 });
        }
        if (content.trim().length > 1000) {
            return NextResponse.json({ error: 'Message too long (max 1000 chars).' }, { status: 400 });
        }

        const message = await prisma.roomMessage.create({
            data: { roomId, senderId: userId, content: content.trim() },
            select: {
                id: true,
                senderId: true,
                content: true,
                createdAt: true,
                sender: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json({ message }, { status: 201 });

    } catch (error) {
        console.error('Room Messages POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
