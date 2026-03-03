import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../lib/auth';
import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';

const ALLOWED_TYPES: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!ALLOWED_TYPES[file.type]) {
            return NextResponse.json(
                { error: 'Unsupported file type. Use JPEG, PNG, GIF, WebP, MP4 or WebM.' },
                { status: 400 }
            );
        }

        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'File too large — max 10 MB' }, { status: 400 });
        }

        // UUID filename + correct extension
        const ext = ALLOWED_TYPES[file.type];
        const filename = `${crypto.randomUUID()}${ext}`;

        // Ensure /public/uploads exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        // Write to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (err) {
        console.error('[upload] Error:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
