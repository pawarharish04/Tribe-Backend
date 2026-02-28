import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../../lib/auth';

async function verifyMatchMember(matchId: string, userId: string) {
    const match = await prisma.matchUnlock.findUnique({
        where: { id: matchId },
        select: { id: true, user1Id: true, user2Id: true }
    });
    if (!match) return null;
    if (match.user1Id !== userId && match.user2Id !== userId) return null;
    return match;
}

// ─── GET /api/matches/[id]/messages ─────────────────────────────────────────

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const match = await verifyMatchMember(params.id, userId);
    if (!match) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await prisma.message.findMany({
        where: { matchId: params.id },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
        }
    });

    return NextResponse.json({ messages });
}

// ─── POST /api/matches/[id]/messages ────────────────────────────────────────

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const match = await verifyMatchMember(params.id, userId);
    if (!match) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { content } = await req.json();
    if (!content || content.trim().length === 0) {
        return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    if (content.trim().length > 1000) {
        return NextResponse.json({ error: 'Message too long (max 1000 chars)' }, { status: 400 });
    }

    const message = await prisma.message.create({
        data: {
            matchId: params.id,
            senderId: userId,
            content: content.trim(),
        },
        select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
        }
    });

    return NextResponse.json({ message }, { status: 201 });
}
