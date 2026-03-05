import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const interest = url.searchParams.get('interest');

    if (!interest) {
        return NextResponse.json({ error: 'Interest is required' }, { status: 400 });
    }

    try {
        const posts = await prisma.interestPost.findMany({
            where: {
                interest: {
                    name: {
                        equals: interest,
                        mode: 'insensitive',
                    }
                },
                mediaId: {
                    not: null
                }
            },
            take: 10,
            orderBy: [
                { likes: { _count: 'desc' } },
                { createdAt: 'desc' }
            ],
            include: {
                media: true,
                user: {
                    select: {
                        name: true,
                        id: true,
                        avatarUrl: true
                    }
                }
            }
        });

        const formatted = posts.map(p => ({
            id: p.id,
            caption: p.caption,
            mediaUrl: p.media?.url,
            mediaType: p.media?.type,
            creatorName: p.user.name,
            creatorId: p.user.id,
            creatorAvatar: p.user.avatarUrl
        }));

        return NextResponse.json(formatted, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch trending posts' }, { status: 500 });
    }
}
