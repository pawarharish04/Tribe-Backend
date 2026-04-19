import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { verifyIdentity } from '../../../../services/rekognitionService';

// POST /api/ai/verify
// Body: { selfieBase64: "data:image/jpeg;base64,..." }
export async function POST(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { selfieBase64 } = await req.json();

        if (!selfieBase64) {
            return NextResponse.json({ error: 'selfieBase64 is required' }, { status: 400 });
        }

        // Get user's current avatar
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true, isVerified: true }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (user.isVerified) {
            return NextResponse.json({ message: 'Already verified', verified: true });
        }

        if (!user.avatarUrl) {
            return NextResponse.json({
                error: 'Please upload a profile photo first before verification.'
            }, { status: 400 });
        }

        // Read the avatar image from the public folder for comparison
        const fs = await import('fs/promises');
        const path = await import('path');
        const avatarPath = path.join(process.cwd(), 'public', user.avatarUrl);

        let avatarBase64: string;
        try {
            const avatarBuffer = await fs.readFile(avatarPath);
            avatarBase64 = avatarBuffer.toString('base64');
        } catch {
            return NextResponse.json({
                error: 'Could not read avatar image. Please re-upload your profile photo.'
            }, { status: 400 });
        }

        // Compare faces using AI
        const isMatch = await verifyIdentity(selfieBase64, avatarBase64);

        if (isMatch) {
            await prisma.user.update({
                where: { id: userId },
                data: { isVerified: true }
            });

            return NextResponse.json({
                verified: true,
                message: 'Identity verified! You now have the ✅ badge.'
            });
        } else {
            return NextResponse.json({
                verified: false,
                message: 'The selfie did not match your profile photo. Please try again with better lighting and a clear face.'
            });
        }
    } catch (error) {
        console.error('[AI Verify] Error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
