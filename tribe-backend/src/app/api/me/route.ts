import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { generateBioEmbedding } from '../../../services/embeddingService';

// ─── GET /api/me ──────────────────────────────────────────────────────────────

export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Stats
    const [matchCount, postLikeCount, messageCount] = await Promise.all([
        prisma.matchUnlock.count({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        }),
        prisma.postLike.count({
            where: { post: { userId } },
        }),
        prisma.message.count({
            where: { senderId: userId },
        }),
    ]);

    return NextResponse.json({
        user,
        stats: {
            matches: matchCount,
            postLikes: postLikeCount,
            messagesSent: messageCount,
        },
    });
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
