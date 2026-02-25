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
export function calculateInterestScore(
    userInterests: InterestData[],
    targetInterests: InterestData[]
): number {
    let score = 0;

    const userInterestMap = new Map<string, InterestData>();
    userInterests.forEach(ui => userInterestMap.set(ui.interestId, ui));

    targetInterests.forEach(ti => {
        // Exact Match
        if (userInterestMap.has(ti.interestId)) {
            score += 20;

            // Optional strength weight bonus if the user has a level defined
            const userLevel = userInterestMap.get(ti.interestId)?.level || 1;
            const targetLevel = ti.level || 1;

            // Bonus for high mutual proficiency
            if (userLevel > 1 && targetLevel > 1) {
                score += Math.min(userLevel, targetLevel) * 2;
            }
            return;
        }

        // Parent-Child match (One user's interest is the parent of the other's)
        let matchedParentChild = false;
        userInterests.forEach(ui => {
            // If Target's parent is the User's exact interest, or User's parent is the Target's exact interest
            if (ti.interest.parentId === ui.interestId || ui.interest.parentId === ti.interestId) {
                score += 12;
                matchedParentChild = true;
            }
        });

        if (matchedParentChild) return;

        // Same-Category match (Siblings sharing the same parent)
        userInterests.forEach(ui => {
            if (
                ti.interest.parentId &&
                ui.interest.parentId &&
                ti.interest.parentId === ui.interest.parentId
            ) {
                score += 8;
            }
        });
    });

    return score;
}

/**
 * Calculates the final match score by taking the base interest score 
 * and penalizing it based on distance.
 */
export function calculateFinalMatchScore(interestScore: number, distanceSq: number | null): number {
    if (distanceSq === null) return interestScore; // No distance penalty if location is not a factor

    // Example penalty calculation:
    // Since 0.1 degree is ~11km, distanceSq for 11km is 0.01.
    // We can derive a simple penalty multiplier.
    // Here, every 0.01 distanceSq reduces score by 5 points.
    const distancePenalty = (distanceSq / 0.01) * 5;

    return Math.max(0, interestScore - distancePenalty);
}
