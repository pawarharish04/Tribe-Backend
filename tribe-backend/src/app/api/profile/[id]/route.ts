import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { calculateDistanceSq, calculateInterestScore, calculateFinalMatchScore, getDistanceFactor, calculateMomentumBoost } from '../../../../lib/matching';
import { calculateCompatibility } from '../../../../services/compatibilityEngine';

export async function GET(req: Request, context: any) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Handle both Promise params (Next 15) and object params (Next 14) safely
        let candidateId = context.params?.id;
        if (context.params instanceof Promise) {
            candidateId = (await context.params).id;
        } else if (!candidateId) {
            // fallback if it was somehow awaited earlier or wrapped differently
            candidateId = await Promise.resolve(context.params).then(p => p.id);
        }

        if (!candidateId) {
            return NextResponse.json({ error: 'Missing candidate ID' }, { status: 400 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                latitude: true, longitude: true,
                interests: {
                    select: {
                        interestId: true, level: true,
                        interest: { select: { parentId: true } }
                    }
                },
                interestPosts: {
                    where: { createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
                    select: { interestId: true, createdAt: true }
                }
            }
        }) as any;

        if (!currentUser) return NextResponse.json({ error: 'Current user not found' }, { status: 404 });

        const candidate = await prisma.user.findUnique({
            where: { id: candidateId },
            include: {
                interests: {
                    include: { interest: true }
                },
                interestPosts: {
                    orderBy: { createdAt: 'desc' },
                    include: { interest: true, media: true }
                }
            }
        });

        if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });

        // 1. Determine Match / Reveal State
        const matchRecord = await prisma.matchUnlock.findFirst({
            where: {
                OR: [
                    { user1Id: userId, user2Id: candidateId },
                    { user1Id: candidateId, user2Id: userId }
                ]
            }
        });

        const isMatched = !!matchRecord;
        const isSelf = userId === candidateId;
        const isRevealed = isMatched || isSelf;

        // 2. Prepare Scoring Inputs
        const hasLocation = currentUser.latitude !== null && currentUser.longitude !== null;
        let distanceSq: number | null = null;
        if (hasLocation && candidate.latitude !== null && candidate.longitude !== null) {
            distanceSq = calculateDistanceSq(
                currentUser.latitude!, currentUser.longitude!,
                candidate.latitude, candidate.longitude
            );
        }

        // Interest Match Base Score
        const candidateInterestsForScoring = candidate.interests.map((ci: any) => ({
            interestId: ci.interestId,
            level: ci.level,
            interest: { parentId: ci.interest.parentId, usageCount: ci.interest.usageCount }
        }));

        const breakdown = calculateInterestScore(currentUser.interests as any, candidateInterestsForScoring as any);
        const interestScore = breakdown.score;

        // Post-expression boost & Momentum boost
        const sharedInterestIds = new Set(currentUser.interests.map((ui: any) => ui.interestId));
        const sharedInterestPostsCount = candidate.interestPosts.filter((post: any) => sharedInterestIds.has(post.interestId)).length;

        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const viewerRecentIds = new Set(currentUser.interestPosts.map((p: any) => p.interestId));
        const candidateRecentIds = new Set(
            candidate.interestPosts
                .filter((p: any) => p.createdAt >= cutoff)
                .map((p: any) => p.interestId)
        );

        const momentumBoost = calculateMomentumBoost(viewerRecentIds as Set<string>, candidateRecentIds as Set<string>);

        const finalScore = calculateFinalMatchScore(interestScore, distanceSq, sharedInterestPostsCount, momentumBoost, candidate.lastActiveAt);

        const distanceKm = distanceSq !== null ? Math.sqrt(distanceSq) * 111 : null;

        // 3. Apply Reveal Restrictions
        const displayName = isRevealed ? candidate.name : (candidate.name ? candidate.name.split(' ')[0] : 'Unknown');
        const restrictedDistance = isRevealed ? distanceKm : (distanceKm !== null ? Math.round(distanceKm / 5) * 5 : null);

        // 4. Creative Compatibility Engine Overlay
        const creativeCompatibilityResult = await calculateCompatibility(userId, candidateId);

        let returnedPosts = candidate.interestPosts;
        if (!isRevealed) {
            returnedPosts = returnedPosts.slice(0, 3) as any;
        }

        // Annotate candidate interests with deeper structural compatibility metadata for UI render
        const parentIdsViewer = new Set(currentUser.interests.map((ui: any) => ui.interest.parentId).filter(Boolean));

        const annotatedInterests = candidate.interests.map((ci: any) => {
            const isExact = sharedInterestIds.has(ci.interestId);
            const isParentMatch = parentIdsViewer.has(ci.interest.parentId);

            const postCountForInterest = candidate.interestPosts.filter((ip: any) => ip.interestId === ci.interestId).length;

            return {
                interestId: ci.interestId,
                name: ci.interest.name,
                level: ci.level,
                usageCount: ci.interest.usageCount,
                isExactMatch: isExact,
                isParentMatch: isParentMatch,
                postCount: postCountForInterest
            };
        });

        return NextResponse.json({
            id: candidate.id,
            displayName: displayName,
            revealed: isRevealed,
            ...(candidate.distanceVisibility === false ? { distanceKm: null, distanceHidden: true } : { distanceKm: restrictedDistance }),
            exactDistance: isRevealed,
            ...(candidate.activityVisibility === false ? { lastActiveAt: null } : { lastActiveAt: candidate.lastActiveAt }),
            score: finalScore,
            compatibility: {
                baseInterestScore: interestScore,
                exactMatches: breakdown.exactMatches,
                parentMatches: breakdown.parentChildMatches,
                categoryMatches: breakdown.sameCategoryMatches,
                momentumBoost: momentumBoost
            },
            creativeCompatibility: {
                score: Math.round(creativeCompatibilityResult.totalScore),
                sharedInterests: creativeCompatibilityResult.sharedInterests
            },
            interests: annotatedInterests,
            posts: returnedPosts
        }, { status: 200 });

    } catch (error: any) {
        console.error('Profile View Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
