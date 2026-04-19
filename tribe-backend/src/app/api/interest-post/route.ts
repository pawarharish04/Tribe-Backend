import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { detectLabels } from '../../../services/rekognitionService';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
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

        // --- AWS Rekognition Auto-Tagging ---
        let autoTagConnections: { id: string }[] = [];
        if (mediaId) {
            try {
                const media = await prisma.media.findUnique({ where: { id: mediaId } });
                if (media && media.url && media.type === 'image') {
                    const filePath = path.join(process.cwd(), 'public', media.url);
                    const fileBuffer = await fs.readFile(filePath);
                    const base64Image = fileBuffer.toString('base64');

                    const labels = await detectLabels(base64Image);
                    if (labels.length > 0) {
                        const matchedInterests = await prisma.interest.findMany({
                            where: { name: { in: labels } }
                        });
                        autoTagConnections = matchedInterests.map(i => ({ id: i.id }));
                        console.log(`[Auto-Tag] Discovered tags for post:`, labels, `Matched IDs:`, autoTagConnections);
                    }
                }
            } catch (err) {
                console.error("[Auto-Tag] Error during label detection", err);
            }
        }
        // ------------------------------------

        const post = await prisma.interestPost.create({
            data: {
                userId,
                interestId,
                mediaId,
                caption,
                autoTags: autoTagConnections.length > 0 ? { connect: autoTagConnections } : undefined
            },
            include: {
                autoTags: true
            }
        });

        return NextResponse.json(post, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to create interest post' }, { status: 500 });
    }
}
