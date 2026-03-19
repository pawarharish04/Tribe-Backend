import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../../lib/auth';

// POST /api/rooms/[roomId]/leave
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

        await prisma.roomMembership.deleteMany({
            where: { roomId, userId }
        });

        return NextResponse.json({ message: 'Left room successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Room Leave POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
