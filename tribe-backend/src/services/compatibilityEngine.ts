import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface CompatibilityResult {
    userId: string;
    interestScore: number;
    contentScore: number;
    interactionScore: number;
    vectorScore: number;
    totalScore: number;
    sharedInterests: string[];
}

/**
 * Calculates compatibility between a primary user and a batch of candidate users.
 * Designed to avoid N+1 queries.
 */
export async function calculateCompatibilityBatch(primaryUserId: string, candidateIds: string[]): Promise<CompatibilityResult[]> {
    if (candidateIds.length === 0) return [];

    // Fetch primary user
    const primaryUser = await prisma.user.findUnique({
        where: { id: primaryUserId },
        include: {
            interests: { include: { interest: true } },
            interestPosts: { select: { interestId: true } },
            postLikes: { select: { postId: true } }
        }
    });

    if (!primaryUser) return [];

    let vectorDistances = new Map<string, number>();
    try {
        const vResults = await prisma.$queryRaw<{id: string, distance: number | null}[]>`
            SELECT id, "bioEmbedding" <=> (SELECT "bioEmbedding" FROM "User" WHERE id = ${primaryUserId}::uuid) as distance
            FROM "User"
            WHERE id IN (${Prisma.join(candidateIds.map(id => Prisma.sql`${id}::uuid`))}) AND "bioEmbedding" IS NOT NULL
        `;
        vResults.forEach(r => {
            if (r.distance !== null) vectorDistances.set(r.id, r.distance);
        });
    } catch (err) {
        console.error("Vector search failed or pgvector not installed.", err);
    }

    // Fetch all candidates in one query
    const candidates = await prisma.user.findMany({
        where: { id: { in: candidateIds } },
        include: {
            interests: { include: { interest: true } },
            interestPosts: { select: { interestId: true } },
            postLikes: { select: { postId: true } }
        }
    });

    // Hash sets for primary user (for O(1) lookups)
    const interestsA = new Set(primaryUser.interests.map(i => i.interest.name));
    const postInterestsA = new Set(primaryUser.interestPosts.map(p => p.interestId));
    const likesA = new Set(primaryUser.postLikes.map(l => l.postId));

    const results: CompatibilityResult[] = [];

    for (const userB of candidates) {
        // --- 1. Interest Similarity ---
        const interestsB = new Set(userB.interests.map(i => i.interest.name));
        let sharedInterestsCount = 0;
        const sharedInterestsNames: string[] = [];

        for (const interest of interestsB) {
            if (interestsA.has(interest)) {
                sharedInterestsCount++;
                sharedInterestsNames.push(interest);
            }
        }

        const uniqueInterestsCount = new Set([...interestsA, ...interestsB]).size;
        const interestScore = uniqueInterestsCount === 0 ? 0 : (sharedInterestsCount / uniqueInterestsCount) * 100;

        // --- 2. Creative Content Similarity ---
        const postInterestsB = new Set(userB.interestPosts.map(p => p.interestId));
        let sharedPostInterestsCount = 0;

        for (const pId of postInterestsB) {
            if (postInterestsA.has(pId)) sharedPostInterestsCount++;
        }

        const uniquePostInterestsCount = new Set([...postInterestsA, ...postInterestsB]).size;
        const contentScore = uniquePostInterestsCount === 0 ? 0 : (sharedPostInterestsCount / uniquePostInterestsCount) * 100;

        // TODO: Future AI Upgrade
        // mediaEmbeddingVector
        // Use cosine similarity to compare images when embeddings are available

        // --- 3. Interaction Similarity ---
        const likesB = new Set(userB.postLikes.map(l => l.postId));
        let sharedLikesCount = 0;

        for (const postId of likesB) {
            if (likesA.has(postId)) sharedLikesCount++;
        }

        const uniqueLikesCount = new Set([...likesA, ...likesB]).size;
        const interactionScore = uniqueLikesCount === 0 ? 0 : (sharedLikesCount / uniqueLikesCount) * 100;

        // --- 4. Vector AI Score ---
        const distance = vectorDistances.get(userB.id) ?? 1; // Default to neutral distance (1)
        const vectorScore = Math.max(0, (1 - (distance / 2)) * 100);

        // --- 5. Final Score ---
        // Heavily weight the AI vector score (40%), interests (30%), content (20%), interaction (10%)
        const totalScore = (interestScore * 0.3) + (contentScore * 0.2) + (interactionScore * 0.1) + (vectorScore * 0.4);

        results.push({
            userId: userB.id,
            interestScore,
            contentScore,
            interactionScore,
            vectorScore,
            totalScore,
            sharedInterests: sharedInterestsNames
        });
    }

    return results;
}

export async function calculateCompatibility(userAId: string, userBId: string): Promise<CompatibilityResult> {
    const results = await calculateCompatibilityBatch(userAId, [userBId]);
    return results[0] || { userId: userBId, interestScore: 0, contentScore: 0, interactionScore: 0, vectorScore: 0, totalScore: 0, sharedInterests: [] };
}
