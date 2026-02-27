import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

export async function POST(req: Request) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { interestId, mediaId, caption } = body;

        if (!interestId) {
            return NextResponse.json({ error: 'interestId is required' }, { status: 400 });
        }

        // Enforce: Max 5 posts per interest per user constraint
        const postCount = await prisma.interestPost.count({
            where: {
                userId,
                interestId
            }
        });

        if (postCount >= 5) {
            return NextResponse.json({ error: 'Maximum 5 posts allowed per interest' }, { status: 403 });
        }

        const post = await prisma.interestPost.create({
            data: {
                userId,
                interestId,
                mediaId,
                caption
            }
        });

        return NextResponse.json(post, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to create interest post' }, { status: 500 });
    }
}
