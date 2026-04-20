import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { trackUserInteraction } from '../../../services/personalizeService';
import { parseBody, z } from '../../../lib/validate';
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit';

const InteractionSchema = z.object({
    targetId: z.string().uuid({ message: 'targetId must be a valid UUID.' }),
    type:     z.enum(['LIKE', 'PASS', 'SUPERLIKE'] as const, {
        error: "type must be one of: LIKE, PASS, SUPERLIKE.",
    }),
});

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Redis sliding-window rate limit: 60 interactions / 60 s ──────────
        const rl = await rateLimit(userId, 'interactions', 60, 60);
        if (!rl.allowed) return rateLimitResponse(rl);
        // ─────────────────────────────────────────────────────────────────────

        const parsed = await parseBody(req, InteractionSchema);
        if (!parsed.ok) return parsed.response;
        const { targetId, type } = parsed.data;

        if (userId === targetId) {
            return NextResponse.json({ error: 'Cannot interact with yourself.' }, { status: 400 });
        }

        // Check if interaction already exists to prevent duplicate likes
        const existingInteraction = await prisma.interaction.findUnique({
            where: {
                actorId_targetId: { actorId: userId, targetId: targetId }
            }
        });

        // If they already liked the person and they're just re-submitting, just return a 200 to save DB writes
        if (existingInteraction && existingInteraction.type === type && (type === 'LIKE' || type === 'SUPERLIKE')) {
            return NextResponse.json({ message: 'Interaction already recorded', matched: false, interaction: existingInteraction }, { status: 200 });
        }

        let isMatch = false;

        // Execute signal and reciprocal check in a transaction
        const interaction = await prisma.$transaction(async (tx: any) => {
            // Upsert the interaction signal
            const inter = await tx.interaction.upsert({
                where: { actorId_targetId: { actorId: userId, targetId: targetId } },
                update: { type: type },
                create: { actorId: userId, targetId: targetId, type: type }
            });

            // Match Logic Calculation
            if (type === 'LIKE' || type === 'SUPERLIKE') {
                const reciprocalInteraction = await tx.interaction.findUnique({
                    where: { actorId_targetId: { actorId: targetId, targetId: userId } }
                });

                if (reciprocalInteraction && (reciprocalInteraction.type === 'LIKE' || reciprocalInteraction.type === 'SUPERLIKE')) {
                    isMatch = true;
                    const [user1Id, user2Id] = [userId, targetId].sort();

                    await tx.matchUnlock.upsert({
                        where: { user1Id_user2Id: { user1Id: user1Id, user2Id: user2Id } },
                        update: {},
                        create: { user1Id: user1Id, user2Id: user2Id }
                    });
                }
            }
            return inter;
        });

        // AI Personalize Tracking
        trackUserInteraction(userId, targetId, type as 'LIKE'|'PASS'|'SUPERLIKE').catch(err => console.error("Personalize tracking failed", err));

        if (isMatch) {
            return NextResponse.json({ message: 'It\'s a match!', matched: true, interaction }, { status: 201 });
        }

        return NextResponse.json({ message: 'Interaction saved successfully', matched: false, interaction }, { status: 201 });

    } catch (error) {
        console.error('Interaction/Signal Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
