import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { generateIcebreakers } from '../../../../services/wingmanService';

// GET /api/ai/icebreakers?matchId=xxx
// Returns auto-generated icebreakers for a specific match
export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ error: 'matchId query param is required' }, { status: 400 });
        }

        // Verify the user is part of this match
        const match = await prisma.matchUnlock.findFirst({
            where: {
                id: matchId,
                OR: [{ user1Id: userId }, { user2Id: userId }]
            }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Check if there are already messages (don't show icebreakers if conversation started)
        const messageCount = await prisma.message.count({ where: { matchId } });
        if (messageCount > 0) {
            return NextResponse.json({ suggestions: [], alreadyChatting: true });
        }

        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;

        const userInclude = {
            interests: { select: { interest: { select: { name: true } } }, take: 10 },
            interestPosts: {
                select: { caption: true, interest: { select: { name: true } } },
                orderBy: { createdAt: 'desc' as const },
                take: 5
            }
        };

        const [currentUser, partnerUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, include: userInclude }),
            prisma.user.findUnique({ where: { id: partnerId }, include: userInclude })
        ]);

        if (!currentUser || !partnerUser) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 });
        }

        const profileA = {
            name: currentUser.name || 'Anonymous',
            bio: currentUser.bio,
            interests: currentUser.interests.map((ui: any) => ui.interest.name),
            recentPosts: currentUser.interestPosts.map((p: any) => ({
                caption: p.caption,
                interestName: p.interest?.name || ''
            }))
        };

        const profileB = {
            name: partnerUser.name || 'Anonymous',
            bio: partnerUser.bio,
            interests: partnerUser.interests.map((ui: any) => ui.interest.name),
            recentPosts: partnerUser.interestPosts.map((p: any) => ({
                caption: p.caption,
                interestName: p.interest?.name || ''
            }))
        };

        const suggestions = await generateIcebreakers(profileA, profileB);

        return NextResponse.json({
            suggestions,
            partnerName: partnerUser.name,
            sharedInterests: profileA.interests.filter((i: string) => profileB.interests.includes(i))
        });
    } catch (error) {
        console.error('[AI Icebreakers] Error:', error);
        return NextResponse.json({ error: 'Failed to generate icebreakers' }, { status: 500 });
    }
}
