import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { calculateCompatibilityBatch } from '../../../services/compatibilityEngine';

const RECOM_CACHE = new Map<string, { data: any; expiresAt: number }>();

export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Cache lookup
        const cached = RECOM_CACHE.get(userId);
        if (cached && cached.expiresAt > Date.now()) {
            return NextResponse.json(cached.data);
        }

        // 1. Fetch up to 200 candidates to compare against
        // We exclude the current user.
        // In a large system, you might filter by distance or recent activity.
        const candidates = await prisma.user.findMany({
            where: { id: { not: userId } },
            take: 200,
            select: { id: true, name: true, avatarUrl: true }
        });

        if (candidates.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        // Create a map to attach details later
        const candidateMap = new Map(candidates.map(c => [c.id, c]));

        // 2. Batch calculate compatibility
        const candidateIds = candidates.map(c => c.id);
        const compatibilities = await calculateCompatibilityBatch(userId, candidateIds);

        // 3. Sort by totalScore
        const sorted = compatibilities
            .filter(c => c.totalScore > 0) // only returning people with some overlap
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 20); // Top 20

        // 4. Format response
        const formattedResponse = sorted.map(c => {
            const userDetails = candidateMap.get(c.userId);
            return {
                userId: c.userId,
                name: userDetails?.name ?? 'Unknown',
                avatarUrl: userDetails?.avatarUrl ?? null,
                compatibilityScore: c.totalScore,
                sharedInterests: c.sharedInterests
            };
        });

        // Cache for 10 minutes
        RECOM_CACHE.set(userId, {
            data: formattedResponse,
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        return NextResponse.json(formattedResponse, { status: 200 });

    } catch (error) {
        console.error('Recommend Creators Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
