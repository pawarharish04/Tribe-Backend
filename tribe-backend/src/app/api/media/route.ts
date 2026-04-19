import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { url, type, width, height } = body;

        if (!url || !type) {
            return NextResponse.json({ error: 'URL and type are required' }, { status: 400 });
        }

        if (type !== 'image' && type !== 'video') {
            return NextResponse.json({ error: 'Type must be "image" or "video"' }, { status: 400 });
        }

        const media = await prisma.media.create({
            data: {
                userId,
                url,
                type,
                width,
                height
            }
        });

        return NextResponse.json(media, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to create media' }, { status: 500 });
    }
}
