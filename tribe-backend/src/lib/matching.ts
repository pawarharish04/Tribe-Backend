// src/lib/matching.ts

/**
 * Calculates the approximate Euclidean distance squared.
 * We use squared distance to avoid expensive square root calculations,
 * since we only need relative distance for sorting/penalizing.
 * 
 * Note: 1 degree of latitude is ~111km.
 */
export function calculateDistanceSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = lat1 - lat2;
    const dLon = lon1 - lon2;
    return dLat * dLat + dLon * dLon;
}

export interface InterestData {
    interestId: string;
    level?: number | null;
    interest: {
        parentId: string | null;
        usageCount?: number;
    };
}

/**
 * Advanced Match Scoring Algorithm
 * 
 * score = (sharedExact × 30) + (parentChild × 18) + (sameCategory × 12) + (strengthWeight × multiplier)
 */
export interface ScoreBreakdown {
    score: number;
    exactMatches: number;
    parentChildMatches: number;
    sameCategoryMatches: number;
}

export function getRarityFactor(usageCount: number): number {
    if (usageCount < 10) return 1.2;
    if (usageCount < 25) return 1.1;
    if (usageCount < 50) return 1.05;
    return 1.0;
}

export function calculateInterestScore(
    userInterests: InterestData[],
    targetInterests: InterestData[]
): ScoreBreakdown {
    let score = 0;
    let exactMatches = 0;
    let parentChildMatches = 0;
    let sameCategoryMatches = 0;

    const userInterestMap = new Map<string, InterestData>();
    userInterests.forEach(ui => userInterestMap.set(ui.interestId, ui));

    targetInterests.forEach(ti => {
        // Exact Match
        if (userInterestMap.has(ti.interestId)) {
            const basePoints = 20;

            const userLevel = userInterestMap.get(ti.interestId)?.level || 1;
            const targetLevel = ti.level || 1;

            // level multiplier = min(userLevel, targetLevel) * 2, capped at 10
            const levelBonus = Math.min(Math.min(userLevel, targetLevel) * 2, 10);
            score += basePoints + levelBonus;

            exactMatches++;
            return;
        }

        // Parent-Child match (One user's interest is the parent of the other's)
        let matchedParentChild = false;
        for (const ui of userInterests) {
            if (ti.interest.parentId === ui.interestId || ui.interest.parentId === ti.interestId) {
                score += 12;
                matchedParentChild = true;
                parentChildMatches++;
                break;
            }
        }

        if (matchedParentChild) return;

        // Same-Category match (Siblings sharing the same parent)
        for (const ui of userInterests) {
            if (
                ti.interest.parentId &&
                ui.interest.parentId &&
                ti.interest.parentId === ui.interest.parentId
            ) {
                score += 8;
                sameCategoryMatches++;
                break;
            }
        }
    });

    return {
        score,
        exactMatches,
        parentChildMatches,
        sameCategoryMatches
    };
}

export function getDistanceFactor(distanceKm: number): number {
    if (distanceKm <= 5) return 1.0;
    if (distanceKm <= 20) return 0.9;
    if (distanceKm <= 50) return 0.8;
    if (distanceKm <= 100) return 0.7;
    return 0.6;
    return 0.6;
}

export function getActivityFactor(lastActiveAt: Date | undefined | null): number {
    if (!lastActiveAt) return 0.9; // Fallback for old records without this set

    const hoursSinceActive = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceActive <= 6) return 1.1;
    if (hoursSinceActive <= 24) return 1.05;
    if (hoursSinceActive <= 72) return 1.0;
    if (hoursSinceActive <= 168) return 0.95;
    return 0.9;
}
export function calculateMomentumBoost(
    viewerRecentInterestIds: Set<string>,
    candidateRecentInterestIds: Set<string>
): number {
    let sharedRecent = 0;

    for (const id of viewerRecentInterestIds) {
        if (candidateRecentInterestIds.has(id)) {
            sharedRecent++;
        }
    }

    return Math.min(sharedRecent * 3, 6);
}

/**
 * Calculates the final match score by taking the base interest score 
 * and scaling it based on distance, and optionally boosting based on posts.
 */
export function calculateFinalMatchScore(
    interestScore: number,
    distanceSq: number | null,
    sharedInterestPostsCount: number = 0,
    momentumBoost: number = 0
): number {
    const postBoost = Math.min(sharedInterestPostsCount * 2, 6);
    const boostedScore = interestScore + postBoost + momentumBoost;

    if (distanceSq === null) return Math.min(Math.round(boostedScore), 100);

    // penalty: (distanceSq / 0.01) * 5, capped at 30
    const penalty = Math.min((distanceSq / 0.01) * 5, 30);
    
    return Math.max(0, Math.min(Math.round(boostedScore - penalty), 100));
}
