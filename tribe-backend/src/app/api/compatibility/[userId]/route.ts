import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { calculateCompatibility } from '../../../../services/compatibilityEngine';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const currentUserId = getUserIdFromRequest(req);
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId: targetUserId } = await params;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID required.' }, { status: 400 });
        }

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        const result = await calculateCompatibility(currentUserId, targetUserId);

        return NextResponse.json({
            userId: targetUserId,
            score: Math.round(result.totalScore),
            sharedInterests: result.sharedInterests
        }, { status: 200 });

    } catch (error) {
        console.error('Compatibility GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
