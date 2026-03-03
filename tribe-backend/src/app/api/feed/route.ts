import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { calculateDistanceSq, calculateInterestScore, calculateFinalMatchScore, getDistanceFactor, calculateMomentumBoost } from '../../../lib/matching';

const FEED_CACHE = new Map<string, { data: any; expiresAt: number }>();

// ─── Soft Diversity Injection ─────────────────────────────────────────────────────

/**
 * Finds the dominant interest category for a candidate by looking at which
 * of their interests produces the strongest match with the viewer.
 * Returns parentId of the best-matching interest, or the interestId
 * itself if there is no parent.
 */
function getDominantCategory(
    userInterests: { interestId: string; interest: { parentId: string | null } }[],
    candidateInterests: { interestId: string; interest: { parentId: string | null } }[]
): string | null {
    const userInterestMap = new Map(userInterests.map(u => [u.interestId, u]));
    const userParentIds = new Set(userInterests.map(u => u.interest.parentId).filter(Boolean));

    let bestCategory: string | null = null;
    let bestScore = -1;

    for (const ci of candidateInterests) {
        let score = 0;
        if (userInterestMap.has(ci.interestId)) {
            score = 30; // exact match
        } else if (ci.interest.parentId && userParentIds.has(ci.interest.parentId)) {
            score = 12; // same-category match
        }

        if (score > bestScore) {
            bestScore = score;
            bestCategory = ci.interest.parentId ?? ci.interestId;
        }
    }

    // Fallback: use first interest's category
    if (bestCategory === null && candidateInterests.length > 0) {
        bestCategory = candidateInterests[0].interest.parentId ?? candidateInterests[0].interestId;
    }

    return bestCategory;
}

/**
 * Soft category spread: no more than 2 consecutive candidates
 * from the same dominant category. Preserves ranking — only
 * swaps within runs when a cluster threshold is hit.
 */
function applyDiversity(sorted: any[]): any[] {
    const result: any[] = [];
    const remaining = [...sorted];
    const categoryCount = new Map<string, number>();

    while (remaining.length > 0) {
        const candidate = remaining[0];
        const dominant = candidate.dominantCategory ?? '__none__';
        const count = categoryCount.get(dominant) ?? 0;

        if (count >= 2) {
            // Find next candidate with a different dominant category
            const swapIndex = remaining.findIndex(
                (c, i) => i > 0 && (c.dominantCategory ?? '__none__') !== dominant
            );
            if (swapIndex !== -1) {
                const swapped = remaining[swapIndex];
                const swappedCat = swapped.dominantCategory ?? '__none__';
                result.push(swapped);
                categoryCount.set(swappedCat, (categoryCount.get(swappedCat) ?? 0) + 1);
                remaining.splice(swapIndex, 1);
                // Reset the cluster count now that we've broken the run
                categoryCount.set(dominant, 0);
                continue;
            }
            // No different candidate available — allow the cluster (can't diversify)
        }

        result.push(candidate);
        categoryCount.set(dominant, count + 1);
        remaining.shift();
    }

    return result;
}


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

        const cacheKey = `${userId}:${cursorScore ?? 'null'}:${cursorId ?? 'null'}`;
        const cached = FEED_CACHE.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            const cacheHitMs = performance.now() - startTime;
            if (process.env.NODE_ENV !== 'production') {
                console.log(JSON.stringify({
                    event: 'feed_cache_hit',
                    totalMs: cacheHitMs,
                    dbCandidatesMs: 0,
                    dbImpressionsMs: 0,
                    scoringMs: 0,
                    candidateFetched: cached.data.count,
                    candidateReturned: cached.data.count
                }));
            }
            return NextResponse.json(cached.data);
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
        }) as any;

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

            const selectClause = {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                lastActiveAt: true,
                distanceVisibility: true,
                activityVisibility: true
            };

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
                    select: selectClause,
                    take: 60 // bounded candidate fetch to prevent deep table scans
                });
            } else {
                // 3B. User has NO location -> Perform Global Search ignoring distance (Fallback Feed for resilience)
                return await prisma.user.findMany({
                    where: baseWhere,
                    select: selectClause,
                    take: 60
                });
            }
        };

        const candidateStart = performance.now();
        let baseFeedUsers = await fetchCandidates(false);
        if (baseFeedUsers.length === 0) {
            // fallback: ignore impressions filter
            baseFeedUsers = await fetchCandidates(true);
        }

        const candidateIds = baseFeedUsers.map(u => u.id);

        const [interestsRaw, postsRaw] = await Promise.all([
            prisma.userInterest.findMany({
                where: { userId: { in: candidateIds } },
                select: {
                    userId: true,
                    interestId: true,
                    level: true,
                    interest: { select: { id: true, name: true, parentId: true, usageCount: true } }
                }
            }),
            prisma.interestPost.findMany({
                where: { userId: { in: candidateIds } },
                orderBy: { createdAt: 'desc' },
                take: 120, // Theoretical boundary to prevent massive scans
                select: {
                    id: true,
                    userId: true, // required for grouping
                    caption: true,
                    interestId: true,
                    createdAt: true,
                    interest: { select: { id: true, name: true } },
                    media: { select: { id: true, url: true, type: true } }
                }
            })
        ]);

        const interestsByUserId = new Map<string, any[]>();
        interestsRaw.forEach(ui => {
            if (!interestsByUserId.has(ui.userId)) interestsByUserId.set(ui.userId, []);
            interestsByUserId.get(ui.userId)!.push(ui);
        });

        const postsByUserId = new Map<string, any[]>();
        postsRaw.forEach(post => {
            if (!postsByUserId.has(post.userId)) postsByUserId.set(post.userId, []);
            if (postsByUserId.get(post.userId)!.length < 2) {
                postsByUserId.get(post.userId)!.push(post);
            }
        });

        const feedUsers = baseFeedUsers.map(u => ({
            ...u,
            interests: interestsByUserId.get(u.id) || [],
            interestPosts: postsByUserId.get(u.id) || []
        }));

        const dbCandidatesMs = performance.now() - candidateStart;

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
        const scoringStart = performance.now();
        const sortedFeed = feedUsers.map((u: any) => {
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

            const momentumBoost = calculateMomentumBoost(viewerRecentInterestIds as Set<string>, candidateRecentInterestIds as Set<string>);

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
                ...(u.distanceVisibility === false
                    ? { distanceKm: null, distanceHidden: true }
                    : { distanceKm: restrictedDistance }),
                ...(u.activityVisibility === false
                    ? {}
                    : { lastActiveAt: u.lastActiveAt }),
                interests: u.interests,
                posts: u.interestPosts,
                score: finalScore,
                dominantCategory: getDominantCategory(currentUser.interests as any, u.interests as any),

                // Debug specific info
                _name: u.name,
                _interestScore: interestScore,
                _exactMatches: breakdown.exactMatches,
                _parentChildMatches: breakdown.parentChildMatches,
                _sameCategoryMatches: breakdown.sameCategoryMatches,
                _finalScore: finalScore,

                ...(u.distanceVisibility === false
                    ? {}
                    : { _distanceSq: distanceSq, _distanceFactor: distanceFactor }),
                ...(u.activityVisibility === false
                    ? {}
                    : { _activityFactor: activityFactor, _momentumBoost: momentumBoost })
            };
        }).sort((a, b) => {
            // Sort Descending by _finalScore
            if (b._finalScore !== a._finalScore) {
                return b._finalScore - a._finalScore;
            }
            // Deterministic Tiebreaker
            return a.id.localeCompare(b.id);
        });
        const scoringMs = performance.now() - scoringStart;

        // 5a. Soft diversity injection — gentle category spread, preserves ranking
        const diversifiedFeed = applyDiversity(sortedFeed);

        // 5b. Apply Cursor Filter if provided
        let filteredFeed = diversifiedFeed;
        if (cursorScore !== null && cursorId) {
            filteredFeed = diversifiedFeed.filter(c => {
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

            await prisma.feedImpression.createMany({
                data: paginatedFeed.map(c => ({
                    viewerId: userId,
                    targetId: c.id,
                    shownAt: new Date()
                })),
                skipDuplicates: true
            });
        }

        // Update current user's lastActiveAt in a background task
        prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
        }).catch(err => console.error("Failed to update lastActiveAt", err));

        const totalMs = performance.now() - startTime;
        if (process.env.NODE_ENV !== 'production') {
            console.log(JSON.stringify({
                event: 'feed_generated',
                totalMs,
                dbCandidatesMs,
                dbImpressionsMs: 0,
                scoringMs,
                candidateFetched: feedUsers.length,
                candidateReturned: paginatedFeed.length
            }));
        }

        const responsePayload = {
            message: 'Geo feed fetched successfully',
            count: paginatedFeed.length,
            feed: paginatedFeed,
            nextCursor
        };

        FEED_CACHE.set(cacheKey, {
            data: responsePayload,
            expiresAt: Date.now() + 5000
        });

        return NextResponse.json(responsePayload, { status: 200 });

    } catch (error) {
        console.error('Geo Feed Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
