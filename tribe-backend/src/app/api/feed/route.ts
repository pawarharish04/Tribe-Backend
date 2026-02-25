import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

export async function GET(req: Request) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the current user to find their location
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { latitude: true, longitude: true, interests: { select: { interestId: true } } }
        });

        if (!currentUser || !currentUser.latitude || !currentUser.longitude) {
            return NextResponse.json(
                { error: 'User location not set. Please update your profile with coordinates.' },
                { status: 400 }
            );
        }

        // Simple bounding box for Geo Feed (approx 10km depending on latitude)
        // 1 degree latitude = ~111km, so 0.1 degree is ~11km
        const latSpan = 0.1;
        const lonSpan = 0.1;

        const minLat = currentUser.latitude - latSpan;
        const maxLat = currentUser.latitude + latSpan;
        const minLon = currentUser.longitude - lonSpan;
        const maxLon = currentUser.longitude + lonSpan;

        // We can also filter users by shared interests if desired, 
        // but for a general geo feed we'll just fetch users nearby who 
        // haven't been swiped on (interacted with) yet.

        // Get all targets the current user has already acted on (LIKE, PASS, etc)
        const pastInteractions = await prisma.interaction.findMany({
            where: { actorId: userId },
            select: { targetId: true }
        });

        const ignoredUserIds = pastInteractions.map(i => i.targetId);
        // Add current user to ignored list
        ignoredUserIds.push(userId);

        // Query for nearby users
        const feedUsers = await prisma.user.findMany({
            where: {
                id: { notIn: ignoredUserIds },
                latitude: {
                    gte: minLat,
                    lte: maxLat,
                },
                longitude: {
                    gte: minLon,
                    lte: maxLon,
                },
            },
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                interests: {
                    include: {
                        interest: {
                            select: { name: true }
                        }
                    }
                }
            },
            take: 20 // Paginate/limit results
        });

        // Optionally sort by distance (euclidean approximation)
        const sortedFeed = feedUsers.map(u => {
            const dLat = (u.latitude || 0) - currentUser.latitude!;
            const dLon = (u.longitude || 0) - currentUser.longitude!;
            const distSq = dLat * dLat + dLon * dLon;

            // Calculate # of shared interests
            const currentUserInterestIds = currentUser.interests.map(i => i.interestId);
            const sharedInterests = u.interests.filter(i => currentUserInterestIds.includes(i.interestId)).length;

            return { ...u, _distanceSq: distSq, _sharedInterestsCount: sharedInterests };
        }).sort((a, b) => {
            // Prioritize shared interest count, then shortest distance
            if (b._sharedInterestsCount !== a._sharedInterestsCount) {
                return b._sharedInterestsCount - a._sharedInterestsCount;
            }
            return a._distanceSq - b._distanceSq;
        });

        return NextResponse.json({
            message: 'Geo feed fetched successfully',
            count: sortedFeed.length,
            feed: sortedFeed,
        }, { status: 200 });

    } catch (error) {
        console.error('Geo Feed Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
