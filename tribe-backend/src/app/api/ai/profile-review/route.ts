import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { reviewProfile } from '../../../../services/profileCoachService';

export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                bio: true,
                avatarUrl: true,
                isVerified: true,
                createdAt: true,
                interests: {
                    select: { interest: { select: { name: true } } }
                },
                interestPosts: {
                    select: {
                        interest: { select: { name: true } }
                    }
                },
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const matchCount = await prisma.matchUnlock.count({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] }
        });

        const interests = user.interests.map(ui => ui.interest.name);
        const postInterests = [...new Set(user.interestPosts.map(p => p.interest.name))];
        const daysSinceJoined = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        const review = await reviewProfile({
            name: user.name,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            interestCount: interests.length,
            interests,
            postCount: user.interestPosts.length,
            postInterests,
            matchCount,
            isVerified: user.isVerified,
            daysSinceJoined,
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error('[AI Profile Review] Error:', error);
        return NextResponse.json({ error: 'Failed to generate profile review' }, { status: 500 });
    }
}
