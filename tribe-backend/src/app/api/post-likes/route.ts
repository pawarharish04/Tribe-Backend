import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const likes = await prisma.postLike.findMany({
        where: {
            post: { userId } // only likes on MY posts
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            post: {
                include: {
                    interest: { select: { id: true, name: true } }
                }
            },
            liker: {
                select: {
                    id: true,
                    name: true,
                    lastActiveAt: true
                }
            }
        }
    });

    // Apply reveal ladder: only show first name unless matched
    const matchedIds = await prisma.matchUnlock.findMany({
        where: {
            OR: [
                { user1Id: userId },
                { user2Id: userId }
            ]
        },
        select: { user1Id: true, user2Id: true }
    });

    const matchedUserIds = new Set<string>(
        matchedIds.flatMap(m => [m.user1Id, m.user2Id]).filter(id => id !== userId)
    );

    const formatted = likes.map((like: typeof likes[number]) => {
        const isRevealed = matchedUserIds.has(like.liker.id);
        const displayName = isRevealed
            ? like.liker.name
            : (like.liker.name ? like.liker.name.split(' ')[0] : 'Someone');

        return {
            id: like.id,
            likerId: like.liker.id,
            displayName,
            revealed: isRevealed,
            postCaption: like.post.caption,
            interestName: like.post.interest.name,
            lastActiveAt: like.liker.lastActiveAt,
            createdAt: like.createdAt,
        };
    });

    return NextResponse.json({ likes: formatted });
}
