import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';

// ─── POST /api/me/posts ───────────────────────────────────────────────────────
// Body: { interestId, caption?, mediaUrl?, mediaType? }

export async function POST(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { interestId, caption, mediaUrl, mediaType } = body;

    if (!interestId) {
        return NextResponse.json({ error: 'interestId is required' }, { status: 400 });
    }

    // Verify user has this interest
    const userInterest = await prisma.userInterest.findUnique({
        where: { userId_interestId: { userId, interestId } },
    });
    if (!userInterest) {
        return NextResponse.json({ error: 'You have not added this interest' }, { status: 403 });
    }

    // Create media row if provided
    let mediaId: string | undefined;
    if (mediaUrl && mediaType) {
        const media = await prisma.media.create({
            data: { userId, url: String(mediaUrl), type: String(mediaType) },
        });
        mediaId = media.id;
    }

    const post = await prisma.interestPost.create({
        data: {
            userId,
            interestId,
            caption: caption ? String(caption).trim().slice(0, 500) : null,
            mediaId: mediaId ?? null,
        },
        select: {
            id: true,
            caption: true,
            createdAt: true,
            interest: { select: { id: true, name: true } },
            media: { select: { id: true, url: true, type: true } },
            _count: { select: { likes: true } },
        },
    });

    return NextResponse.json({ post }, { status: 201 });
}

// ─── DELETE /api/me/posts?id=... ──────────────────────────────────────────────

export async function DELETE(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const postId = url.searchParams.get('id');
    if (!postId) return NextResponse.json({ error: 'id query param required' }, { status: 400 });

    // Verify ownership
    const post = await prisma.interestPost.findUnique({
        where: { id: postId },
        select: { userId: true, mediaId: true },
    });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.interestPost.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
}
