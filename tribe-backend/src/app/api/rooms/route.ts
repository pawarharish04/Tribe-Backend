import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

// GET /api/rooms — list all interest rooms (with membership status)
export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rooms = await prisma.interestRoom.findMany({
            include: {
                interest: { select: { id: true, name: true } },
                _count: { select: { members: true, messages: true } },
                members: {
                    where: { userId },
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const result = rooms.map((room: any) => ({
            id: room.id,
            interestId: room.interestId,
            interest: room.interest,
            memberCount: room._count.members,
            messageCount: room._count.messages,
            isMember: room.members.length > 0,
            createdAt: room.createdAt,
        }));

        return NextResponse.json({ rooms: result }, { status: 200 });

    } catch (error) {
        console.error('Rooms GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
