import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { calculateDistanceSq, calculateInterestScore, calculateFinalMatchScore, getDistanceFactor, calculateMomentumBoost } from '../../../lib/matching';

export async function GET(req: Request) {
    const startTime = performance.now();
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch current user data and interests
        const url = new URL(req.url);
        const cursorScoreRaw = url.searchParams.get('cursorScore');
        const cursorId = url.searchParams.get('cursorId');

        let cursorScore: number | null = null;
        if (cursorScoreRaw && !isNaN(parseFloat(cursorScoreRaw))) {
            cursorScore = parseFloat(cursorScoreRaw);
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                latitude: true,
                longitude: true,
                interests: {
                    select: {
                        interestId: true,
                        level: true,
                        interest: { select: { parentId: true, usageCount: true } }
                    }
                },
                interestPosts: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    select: { interestId: true, createdAt: true }
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
        const hasLocation = currentUser.latitude !== null && currentUser.longitude !== null;

        const fetchCandidates = async (ignoreImpressions: boolean) => {
            const baseWhere: any = { id: { notIn: ignoredUserIds } };
            if (!ignoreImpressions) {
                baseWhere.NOT = {
                    targetImpressions: {
                        some: {
                            viewerId: userId,
                            shownAt: {
                                gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
                            }
                        }
                    }
                };
            }

            if (hasLocation) {
                // 3A. User HAS location -> Perform Geo-Bounded search
                const latSpan = 0.5; // ~55km bounding radius
                const lonSpan = 0.5;

                const minLat = currentUser.latitude! - latSpan;
                const maxLat = currentUser.latitude! + latSpan;
                const minLon = currentUser.longitude! - lonSpan;
                const maxLon = currentUser.longitude! + lonSpan;

                return await prisma.user.findMany({
                    where: {
                        ...baseWhere,
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
                                interest: { select: { name: true, parentId: true, usageCount: true } }
                            }
                        },
                        interestPosts: {
                            take: 3,
                            orderBy: { createdAt: 'desc' },
                            include: {
                                interest: { select: { id: true, name: true } },
                                media: { select: { id: true, url: true, type: true } }
                            }
                        }
                    },
                    take: 100 // larger pool to calculate scores against
                });
            } else {
                // 3B. User has NO location -> Perform Global Search ignoring distance (Fallback Feed for resilience)
                return await prisma.user.findMany({
                    where: baseWhere,
                    select: {
                        id: true,
                        name: true,
                        latitude: true,
                        longitude: true,
                        interests: {
                            select: {
                                interestId: true,
                                level: true,
                                interest: { select: { name: true, parentId: true, usageCount: true } }
                            }
                        },
                        interestPosts: {
                            take: 3,
                            orderBy: { createdAt: 'desc' },
                            include: {
                                interest: { select: { id: true, name: true } },
                                media: { select: { id: true, url: true, type: true } }
                            }
                        }
                    },
                    take: 100
                });
            }
        };

        let feedUsers = await fetchCandidates(false);
        if (feedUsers.length === 0) {
            // fallback: ignore impressions filter
            feedUsers = await fetchCandidates(true);
        }

        // 4. Determine Mutual Matches (Identity Reveal Ladder)
        const matchRecords = await prisma.matchUnlock.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            select: { user1Id: true, user2Id: true }
        });

        const matchedUserIds = new Set(
            matchRecords.map(m => (m.user1Id === userId ? m.user2Id : m.user1Id))
        );

        // 5. Calculate Scores and Sort
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

            // Calculate final composite Match Score with post boost
            // To evaluate shared posts, we count how many of the candidate's 'interestPosts' have an interestId that's present in currentUser's interests
            const sharedInterestIds = new Set(currentUser.interests.map((ui: any) => ui.interestId));
            const sharedInterestPostsCount = u.interestPosts?.filter((post: any) => sharedInterestIds.has(post.interestId)).length || 0;

            // Calculate Momentum Boost
            const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

            const viewerRecentInterestIds = new Set(
                currentUser.interestPosts
                    ?.filter((p: any) => new Date(p.createdAt) >= cutoff)
                    .map((p: any) => p.interestId) || []
            );

            const candidateRecentInterestIds = new Set(
                u.interestPosts
                    ?.filter((p: any) => new Date(p.createdAt) >= cutoff)
                    .map((p: any) => p.interestId) || []
            );

            const momentumBoost = calculateMomentumBoost(viewerRecentInterestIds, candidateRecentInterestIds);

            const finalScore = calculateFinalMatchScore(interestScore, distanceSq, sharedInterestPostsCount, momentumBoost, u.lastActiveAt);

            const distanceKm = distanceSq !== null ? Math.sqrt(distanceSq) * 111 : 0;
            const distanceFactor = distanceSq !== null ? getDistanceFactor(distanceKm) : 1.0;

            // Optional: Export activity factor for debugging/observability
            const activityFactor = (u.lastActiveAt)
                ? (require('../../../lib/matching').getActivityFactor)(u.lastActiveAt)
                : 1.0;

            // Identity Reveal Restrictions
            const isMatched = matchedUserIds.has(u.id);
            const displayName = isMatched ? u.name : (u.name ? u.name.split(' ')[0] : 'Unknown');
            const restrictedDistance = isMatched ? distanceKm : Math.round(distanceKm / 5) * 5;

            return {
                id: u.id,
                displayName: displayName,
                revealed: isMatched,
                distanceKm: restrictedDistance,
                interests: u.interests,
                posts: u.interestPosts,
                score: finalScore,

                // Debug specific info
                _name: u.name,
                _distanceSq: distanceSq,
                _interestScore: interestScore,
                _distanceFactor: distanceFactor,
                _activityFactor: activityFactor,
                _momentumBoost: momentumBoost,
                _exactMatches: breakdown.exactMatches,
                _parentChildMatches: breakdown.parentChildMatches,
                _sameCategoryMatches: breakdown.sameCategoryMatches,
                _finalScore: finalScore
            };
        }).sort((a, b) => {
            // Sort Descending by _finalScore
            if (b._finalScore !== a._finalScore) {
                return b._finalScore - a._finalScore;
            }
            // Deterministic Tiebreaker
            return a.id.localeCompare(b.id);
        });

        // 5. Apply Cursor Filter if provided
        let filteredFeed = sortedFeed;
        if (cursorScore !== null && cursorId) {
            filteredFeed = sortedFeed.filter(c => {
                if (c._finalScore < cursorScore!) return true;
                if (c._finalScore === cursorScore! && c.id > cursorId!) return true;
                return false;
            });
        }

        // Return top 20
        const limit = 20;
        const paginatedFeed = filteredFeed.slice(0, limit);

        let nextCursor = null;
        if (paginatedFeed.length > 0) {
            // we will only provide next cursor if items were fetched
            const last = paginatedFeed[paginatedFeed.length - 1];
            // if we fetched exactly `limit`, there MIGHT be more
            // but for simplicity, we provide a cursor if there are items
            nextCursor = {
                score: last._finalScore,
                id: last.id
            };

            await Promise.all(paginatedFeed.map(c =>
                prisma.feedImpression.upsert({
                    where: {
                        viewerId_targetId: {
                            viewerId: userId,
                            targetId: c.id
                        }
                    },
                    update: { shownAt: new Date() },
                    create: {
                        viewerId: userId,
                        targetId: c.id
                    }
                })
            ));
        }

        // Update current user's lastActiveAt in a background task
        prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
        }).catch(err => console.error("Failed to update lastActiveAt", err));

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
            feed: paginatedFeed,
            nextCursor
        }, { status: 200 });

    } catch (error) {
        console.error('Geo Feed Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
