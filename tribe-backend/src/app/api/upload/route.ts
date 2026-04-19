import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getUserIdFromRequest } from '../../../lib/auth';
import { moderateMedia } from '../../../services/rekognitionService';

// ─── Cloudinary config (validated at startup via env.ts → prisma.ts) ─────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
});

// ─── Validation constants ─────────────────────────────────────────────────────
const ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
]);

// Cloudinary resource type derived from MIME category
const resourceType = (mime: string): 'image' | 'video' =>
    mime.startsWith('video/') ? 'video' : 'image';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── POST /api/upload ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: 'Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM.' },
                { status: 400 },
            );
        }

        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'File too large — max 10 MB.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // ── Content moderation (images only) ──────────────────────────────────
        if (file.type.startsWith('image/')) {
            const base64 = buffer.toString('base64');
            const modResult = await moderateMedia(base64);
            if (!modResult.isSafe) {
                return NextResponse.json(
                    { error: `Inappropriate content detected: ${modResult.flaggedLabels.join(', ')}` },
                    { status: 400 },
                );
            }
        }

        // ── Upload to Cloudinary via base64 data URI ───────────────────────────
        const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            resource_type: resourceType(file.type),
            folder:        `tribe/uploads/${userId}`,
            // Tags for easy management / moderation from the Cloudinary dashboard
            tags:          ['tribe', userId],
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (err) {
        console.error('[upload] Cloudinary error:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
