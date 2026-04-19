import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { generateIcebreakers, generateCollaborationBrief, generateConversationRescue } from '../../../../services/wingmanService';

// Helper to build a UserProfile from a DB user
function toProfile(user: any) {
    return {
        name: user.name || 'Anonymous',
        bio: user.bio,
        interests: user.interests?.map((ui: any) => ui.interest.name) || [],
        recentPosts: user.interestPosts?.map((p: any) => ({
            caption: p.caption,
            interestName: p.interest?.name || ''
        })) || []
    };
}

const userInclude = {
    interests: { select: { interest: { select: { name: true } } }, take: 10 },
    interestPosts: {
        select: { caption: true, interest: { select: { name: true } } },
        orderBy: { createdAt: 'desc' as const },
        take: 5
    }
};

// POST /api/ai/wingman
// Body: { matchId, action: "icebreakers" | "collab" | "rescue" }
export async function POST(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { matchId, action } = await req.json();

        if (!matchId || !action) {
            return NextResponse.json({ error: 'matchId and action are required' }, { status: 400 });
        }

        // Verify the user is part of this match
        const match = await prisma.matchUnlock.findFirst({
            where: {
                id: matchId,
                OR: [{ user1Id: userId }, { user2Id: userId }]
            }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 404 });
        }

        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;

        // Fetch both user profiles
        const [currentUser, partnerUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, include: userInclude }),
            prisma.user.findUnique({ where: { id: partnerId }, include: userInclude })
        ]);

        if (!currentUser || !partnerUser) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 });
        }

        const profileA = toProfile(currentUser);
        const profileB = toProfile(partnerUser);

        switch (action) {
            case 'icebreakers': {
                const suggestions = await generateIcebreakers(profileA, profileB);
                return NextResponse.json({ suggestions, type: 'icebreakers' });
            }

            case 'collab': {
                const brief = await generateCollaborationBrief(profileA, profileB);
                return NextResponse.json({ brief, type: 'collaboration' });
            }

            case 'rescue': {
                // Fetch recent messages for context
                const messages = await prisma.message.findMany({
                    where: { matchId },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { sender: { select: { name: true } } }
                });

                const recentMessages = messages.reverse().map(m => ({
                    sender: m.sender.name || 'User',
                    content: m.content
                }));

                const suggestions = await generateConversationRescue(profileA, profileB, recentMessages);
                return NextResponse.json({ suggestions, type: 'rescue' });
            }

            default:
                return NextResponse.json({ error: 'Invalid action. Use: icebreakers, collab, rescue' }, { status: 400 });
        }
    } catch (error) {
        console.error('[AI Wingman] Error:', error);
        return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
    }
}
