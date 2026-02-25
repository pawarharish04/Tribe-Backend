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
 * score = (sharedExact × 20) + (parentChild × 12) + (sameCategory × 8) + (strengthWeight × multiplier)
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
            const basePoints = 20;

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
                score += 12;
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
                score += 8;
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

/**
 * Calculates the final match score by taking the base interest score 
 * and penalizing it based on distance.
 */
export function calculateFinalMatchScore(interestScore: number, distanceSq: number | null): number {
    if (distanceSq === null) return Math.max(0, interestScore); // No distance penalty if location is not a factor

    // Example penalty calculation:
    // Since 0.1 degree is ~11km, distanceSq for 11km is 0.01.
    // We cap the maximum distance penalty to 30 so that exceptional interest matches 
    // can still inevitably surface above very close zero-interest users.
    const distancePenalty = Math.min((distanceSq / 0.01) * 5, 30); // Cap penalty at 30 points

    return Math.max(0, interestScore - distancePenalty); // Ensure negative scores are impossible
}
