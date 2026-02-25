import { calculateInterestScore, calculateDistanceSq, calculateFinalMatchScore, InterestData } from './matching';

const buildInterest = (interestId: string, parentId: string | null = null, level: number | null = 1): InterestData => ({
    interestId,
    level,
    interest: { parentId }
});

describe('Match Scoring Engine', () => {
    describe('calculateInterestScore', () => {
        // 1. Exact match scoring gives 20 points + level multiplier.
        it('gives 20 points for exact match plus level multiplier', () => {
            const userInterests = [buildInterest('A', null, 3)];
            const targetInterests = [buildInterest('A', null, 4)];
            // Math.min(3, 4) = 3. 3 * 2 = 6. Cap is 10. Total = 20 + 6 = 26
            const score = calculateInterestScore(userInterests, targetInterests);
            expect(score).toBe(26);
        });

        // 2. Parent-child match gives 12 points.
        it('gives 12 points for parent-child match', () => {
            // User interest 'B' has parent 'A'
            // Target has interest 'A'
            const userInterests = [buildInterest('B', 'A')];
            const targetInterests = [buildInterest('A', null)];
            const score = calculateInterestScore(userInterests, targetInterests);
            expect(score).toBe(12);
        });

        // 3. Same category match gives 8 points.
        it('gives 8 points for same category match (siblings)', () => {
            // User interest 'B' has parent 'A', Target interest 'C' has parent 'A'
            const userInterests = [buildInterest('B', 'A')];
            const targetInterests = [buildInterest('C', 'A')];
            const score = calculateInterestScore(userInterests, targetInterests);
            expect(score).toBe(8);
        });

        // 4. No overlap gives 0 points.
        it('gives 0 points for no overlap', () => {
            const userInterests = [buildInterest('A')];
            const targetInterests = [buildInterest('B')];
            const score = calculateInterestScore(userInterests, targetInterests);
            expect(score).toBe(0);
        });

        // 5. Mixed interests (Exact + Category) do not double count.
        it('prevents double counting when multiple matching criteria exist', () => {
            // Target has 'A', User has 'A'. User also has 'B'(parent A), Target has 'B'(parent A).
            // Should be 20 points for 'A' (exact), 20 points for 'B' (exact). 
            // It should NOT add 12 points for B overlapping A (parent-child).
            const userInterests = [buildInterest('A', null), buildInterest('B', 'A')];
            const targetInterests = [buildInterest('A', null), buildInterest('B', 'A')];
            const score = calculateInterestScore(userInterests, targetInterests);
            // 20 (for A level 1) + 20 (for B level 1)
            expect(score).toBe(40);
        });

        // 6. Target with no level defaults to level 1 logic.
        it('defaults to level 1 logic if target has no level', () => {
            const userInterests = [buildInterest('A', null, 5)];
            const targetInterests = [buildInterest('A', null, null)]; // no level
            // level defaults to 1 so no bonus points
            const score = calculateInterestScore(userInterests, targetInterests);
            expect(score).toBe(20);
        });
    });

    describe('calculateFinalMatchScore', () => {
        // 7. Distance penalty applies linearly.
        it('applies distance penalty linearly based on distance formula', () => {
            // base score 40, distanceSq = 0.05 => (0.05 / 0.01) * 5 = 25 penalty
            const score = calculateFinalMatchScore(40, 0.05);
            expect(score).toBe(15);
        });

        // 8. Extremely high distance penalty caps out strictly at 0 (no negative scores).
        it('prevents negative scores when distance penalty is extremely high', () => {
            const score = calculateFinalMatchScore(10, 1.0); // 1.0 distanceSq = very far
            expect(score).toBe(0); // Cannot go below 0
        });

        it('caps distance penalty to a maximum value, allowing exceptionally high base scores to survive', () => {
            // max penalty is 50. Base score is 80.
            const score = calculateFinalMatchScore(80, 100);
            expect(score).toBe(30); // 80 - 50 = 30
        });
    });
});
