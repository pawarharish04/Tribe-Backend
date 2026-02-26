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
            const basePoints = 30;

            // Optional strength weight bonus if the user has a level defined
            const userLevel = userInterestMap.get(ti.interestId)?.level || 1;
            const targetLevel = ti.level || 1;

            // Bonus for high mutual proficiency using a multiplier
            // e.g., level 3 mutual = 0.3 modifier -> 20 * 1.3 = 26
            const strengthModifier = Math.min(userLevel, targetLevel) * 0.1;
            score += basePoints * (1 + strengthModifier);

            exactMatches++;

            return;
        }

        // Parent-Child match (One user's interest is the parent of the other's)
        let matchedParentChild = false;
        for (const ui of userInterests) {
            if (ti.interest.parentId === ui.interestId || ui.interest.parentId === ti.interestId) {
                score += 18;
                matchedParentChild = true;
                parentChildMatches++;
                break; // Prevent double counting for the same target interest
            }
        }

        if (matchedParentChild) return;

        // Same-Category match (Siblings sharing the same parent)
        let matchedCategory = false;
        for (const ui of userInterests) {
            if (
                ti.interest.parentId &&
                ui.interest.parentId &&
                ti.interest.parentId === ui.interest.parentId
            ) {
                score += 12;
                matchedCategory = true;
                sameCategoryMatches++;
                break; // Prevent double counting sibling overlaps
            }
        }
    });

    // Enforce a ceiling so numerous interests don't explode the score
    return {
        score: Math.min(score, 100),
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
}

/**
 * Calculates the final match score by taking the base interest score 
 * and scaling it based on distance.
 */
export function calculateFinalMatchScore(interestScore: number, distanceSq: number | null): number {
    if (distanceSq === null) return Math.round(interestScore);

    const distanceKm = Math.sqrt(distanceSq) * 111;
    const distanceFactor = getDistanceFactor(distanceKm);

    return Math.round(interestScore * distanceFactor);
}
