import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../../lib/auth';

// POST /api/rooms/[roomId]/join
export async function POST(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { roomId } = await params;

        const room = await prisma.interestRoom.findUnique({ where: { id: roomId } });
        if (!room) {
            return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
        }

        // Upsert membership (idempotent)
        await prisma.roomMembership.upsert({
            where: { roomId_userId: { roomId, userId } },
            update: {},
            create: { roomId, userId }
        });

        return NextResponse.json({ message: 'Joined room successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Room Join POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
