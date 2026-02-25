import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

// Simple In-Memory Rate Limiter Map
// Tracks { userId: { count, timestamp } }
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 Minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 Swipes/Signals per minute

export async function POST(req: Request) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- Rate Limiting Strategy ---
        const currentTime = Date.now();
        const userRateData = rateLimitMap.get(userId);

        if (userRateData) {
            // Check if within window
            if (currentTime - userRateData.timestamp < RATE_LIMIT_WINDOW_MS) {
                if (userRateData.count >= RATE_LIMIT_MAX_REQUESTS) {
                    return NextResponse.json(
                        { error: 'Rate limit exceeded. Too many actions. Try again later.' },
                        { status: 429 }
                    );
                }
                userRateData.count++;
                rateLimitMap.set(userId, userRateData);
            } else {
                // Reset Window
                rateLimitMap.set(userId, { count: 1, timestamp: currentTime });
            }
        } else {
            // Initialize rate limit data
            rateLimitMap.set(userId, { count: 1, timestamp: currentTime });
        }
        // -----------------------------

        const body = await req.json();
        const { targetId, type } = body;

        if (!targetId || !type) {
            return NextResponse.json({ error: 'Target ID and Interaction Type required.' }, { status: 400 });
        }

        if (!["LIKE", "PASS", "SUPERLIKE"].includes(type)) {
            return NextResponse.json({ error: 'Invalid Interaction Type.' }, { status: 400 });
        }

        if (userId === targetId) {
            return NextResponse.json({ error: 'Cannot interact with yourself.' }, { status: 400 });
        }

        // Upsert the interaction signal
        const interaction = await prisma.interaction.upsert({
            where: {
                actorId_targetId: {
                    actorId: userId,
                    targetId: targetId
                }
            },
            update: {
                type: type
            },
            create: {
                actorId: userId,
                targetId: targetId,
                type: type
            }
        });

        // Match Logic Calculation (If they liked us, we like them -> Match!)
        if (type === 'LIKE' || type === 'SUPERLIKE') {
            const reciprocalInteraction = await prisma.interaction.findUnique({
                where: {
                    actorId_targetId: {
                        actorId: targetId,
                        targetId: userId
                    }
                }
            });

            if (reciprocalInteraction && (reciprocalInteraction.type === 'LIKE' || reciprocalInteraction.type === 'SUPERLIKE')) {
                // Prevent duplicate match unlocks via string sort ordering or upsert
                const [user1Id, user2Id] = [userId, targetId].sort();

                await prisma.matchUnlock.upsert({
                    where: {
                        user1Id_user2Id: {
                            user1Id: user1Id,
                            user2Id: user2Id
                        }
                    },
                    update: {},
                    create: {
                        user1Id: user1Id,
                        user2Id: user2Id
                    }
                });

                return NextResponse.json({ message: 'It\'s a match!', matched: true, interaction }, { status: 201 });
            }
        }

        return NextResponse.json({ message: 'Interaction saved successfully', matched: false, interaction }, { status: 201 });

    } catch (error) {
        console.error('Interaction/Signal Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
