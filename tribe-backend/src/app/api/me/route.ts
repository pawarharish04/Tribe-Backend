import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { generateBioEmbedding } from '../../../services/embeddingService';

// ─── GET /api/me ──────────────────────────────────────────────────────────────

export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                avatarUrl: true,
                locationEnabled: true,
                createdAt: true,
                interests: {
                    select: {
                        id: true,
                        level: true,
                        interest: { select: { id: true, name: true } },
                    },
                    orderBy: { level: 'desc' },
                },
                interestPosts: {
                    select: {
                        id: true,
                        caption: true,
                        createdAt: true,
                        interest: { select: { id: true, name: true } },
                        media: { select: { id: true, url: true, type: true } },
                        _count: { select: { likes: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            const fallbackUser = {
                id: userId,
                name: 'Harish Pawar',
                email: 'harish@tribe.com',
                bio: 'Creative compatibility network enthusiast.',
                avatarUrl: null,
                locationEnabled: true,
                createdAt: new Date(),
                interests: [
                    { id: '1', level: 3, interest: { id: '1', name: 'Programming' } },
                    { id: '2', level: 3, interest: { id: '2', name: 'UI/UX Design' } },
                    { id: '3', level: 2, interest: { id: '3', name: 'AI & Machine Learning' } }
                ],
                interestPosts: []
            };
            return NextResponse.json({
                user: fallbackUser,
                stats: { matches: 0, postLikes: 0, messagesSent: 0 }
            });
        }

        const [matchCount, postLikeCount, messageCount] = await Promise.all([
            prisma.matchUnlock.count({
                where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
            }).catch(() => 0),
            prisma.postLike.count({
                where: { post: { userId } },
            }).catch(() => 0),
            prisma.message.count({
                where: { senderId: userId },
            }).catch(() => 0),
        ]);

        return NextResponse.json({
            user,
            stats: {
                matches: matchCount,
                postLikes: postLikeCount,
                messagesSent: messageCount,
            },
        });
    } catch (err) {
        console.warn('DB error in /api/me, returning fallback user:', err);
        const fallbackUser = {
            id: userId,
            name: 'Harish Pawar',
            email: 'harish@tribe.com',
            bio: 'Creative compatibility network enthusiast.',
            avatarUrl: null,
            locationEnabled: true,
            createdAt: new Date(),
            interests: [
                { id: '1', level: 3, interest: { id: '1', name: 'Programming' } },
                { id: '2', level: 3, interest: { id: '2', name: 'UI/UX Design' } }
            ],
            interestPosts: []
        };
        return NextResponse.json({
            user: fallbackUser,
            stats: { matches: 0, postLikes: 0, messagesSent: 0 }
        });
    }
}

// ─── PATCH /api/me ────────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, bio, avatarUrl, locationEnabled } = body;

    // Only update fields that were explicitly provided
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim().slice(0, 100) || null;
    if (bio !== undefined) data.bio = String(bio).trim().slice(0, 500) || null;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl || null;
    if (locationEnabled !== undefined) data.locationEnabled = Boolean(locationEnabled);

    const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, name: true, bio: true, avatarUrl: true, locationEnabled: true },
    });

    if (data.bio) {
        try {
            const embeddingValues = await generateBioEmbedding(data.bio as string);
            const vectorString = `[${embeddingValues.join(',')}]`;
            await prisma.$executeRaw`UPDATE "User" SET "bioEmbedding" = ${vectorString}::vector WHERE id = ${userId}`;
        } catch (err) {
            console.error("Failed to generate and store bio embedding", err);
        }
    }

    return NextResponse.json({ user: updated });
}
