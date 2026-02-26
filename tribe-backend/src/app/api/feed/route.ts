import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { calculateDistanceSq, calculateInterestScore, calculateFinalMatchScore, getDistanceFactor } from '../../../lib/matching';

export async function GET(req: Request) {
    const startTime = performance.now();
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch current user data and interests
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                latitude: true,
                longitude: true,
                interests: {
                    select: {
                        interestId: true,
                        level: true,
                        interest: { select: { parentId: true } }
                    }
                }
            }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // GUARD: If user has 0 interests
        if (!currentUser.interests || currentUser.interests.length === 0) {
            return NextResponse.json(
                {
                    message: "Feed empty. Add interests to discover matching people.",
                    feed: [],
                    needsInterests: true
                },
                { status: 200 }
            );
        }

        // 2. Fetch past interactions to ignore
        const pastInteractions = await prisma.interaction.findMany({
            where: { actorId: userId },
            select: { targetId: true }
        });

        const ignoredUserIds = pastInteractions.map((i: any) => i.targetId);
        ignoredUserIds.push(userId); // Add self to neglected list

        // 3. Prepare the feed pool
        let feedUsers: any[] = [];
        const hasLocation = currentUser.latitude !== null && currentUser.longitude !== null;

        if (hasLocation) {
            // 3A. User HAS location -> Perform Geo-Bounded search
            const latSpan = 0.5; // ~55km bounding radius
            const lonSpan = 0.5;

            const minLat = currentUser.latitude! - latSpan;
            const maxLat = currentUser.latitude! + latSpan;
            const minLon = currentUser.longitude! - lonSpan;
            const maxLon = currentUser.longitude! + lonSpan;

            feedUsers = await prisma.user.findMany({
                where: {
                    id: { notIn: ignoredUserIds },
                    latitude: { gte: minLat, lte: maxLat },
                    longitude: { gte: minLon, lte: maxLon },
                },
                select: {
                    id: true,
                    name: true,
                    latitude: true,
                    longitude: true,
                    interests: {
                        select: {
                            interestId: true,
                            level: true,
                            interest: { select: { name: true, parentId: true } }
                        }
                    }
                },
                take: 100 // larger pool to calculate scores against
            });
        } else {
            // 3B. User has NO location -> Perform Global Search ignoring distance (Fallback Feed for resilience)
            feedUsers = await prisma.user.findMany({
                where: {
                    id: { notIn: ignoredUserIds },
                },
                select: {
                    id: true,
                    name: true,
                    latitude: true,
                    longitude: true,
                    interests: {
                        select: {
                            interestId: true,
                            level: true,
                            interest: { select: { name: true, parentId: true } }
                        }
                    }
                },
                take: 100
            });
        }

        // 4. Calculate Scores and Sort
        const sortedFeed = feedUsers.map(u => {
            let distanceSq: number | null = null;

            // Calculate distance if both users have location
            if (hasLocation && u.latitude !== null && u.longitude !== null) {
                distanceSq = calculateDistanceSq(
                    currentUser.latitude!, currentUser.longitude!,
                    u.latitude, u.longitude
                );
            }

            // Calculate Interest Match logic
            const breakdown = calculateInterestScore(currentUser.interests as any, u.interests as any);
            const interestScore = breakdown.score;

            // Calculate final composite Match Score
            const finalScore = calculateFinalMatchScore(interestScore, distanceSq);

            const distanceKm = distanceSq !== null ? Math.sqrt(distanceSq) * 111 : 0;
            const distanceFactor = distanceSq !== null ? getDistanceFactor(distanceKm) : 1.0;

            return {
                ...u,
                _distanceSq: distanceSq,
                _interestScore: interestScore,
                _distanceFactor: distanceFactor,
                _exactMatches: breakdown.exactMatches,
                _parentChildMatches: breakdown.parentChildMatches,
                _sameCategoryMatches: breakdown.sameCategoryMatches,
                _finalScore: finalScore
            };
        }).sort((a, b) => {
            // Sort Descending by _finalScore
            return b._finalScore - a._finalScore;
        });

        // 5. Return top 20
        const paginatedFeed = sortedFeed.slice(0, 20);

        const endTime = performance.now();
        if (process.env.NODE_ENV !== 'production') {
            console.log(JSON.stringify({
                event: 'feed_generated',
                durationMs: Math.round(endTime - startTime),
                candidatesEvaluated: feedUsers.length,
                returnedCount: paginatedFeed.length,
                topScores: paginatedFeed.slice(0, 3).map(u => ({
                    id: u.id,
                    finalScore: u._finalScore,
                    interestScore: u._interestScore,
                    distanceFactor: u._distanceFactor
                }))
            }));
        }

        return NextResponse.json({
            message: 'Geo feed fetched successfully',
            count: paginatedFeed.length,
            feed: paginatedFeed
        }, { status: 200 });

    } catch (error) {
        console.error('Geo Feed Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
