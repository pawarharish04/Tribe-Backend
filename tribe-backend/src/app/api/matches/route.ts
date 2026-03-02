import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { calculateDistanceSq } from '../../../lib/matching';

export async function GET(req: Request) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { latitude: true, longitude: true, interests: { select: { interestId: true } } }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const hasLocation = currentUser.latitude !== null && currentUser.longitude !== null;
        const myInterestIds = new Set(currentUser.interests.map((ui: any) => ui.interestId));

        const matchRecords = await prisma.matchUnlock.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: {
                    select: {
                        id: true, name: true, latitude: true, longitude: true, lastActiveAt: true, distanceVisibility: true, activityVisibility: true,
                        interests: { select: { interestId: true, interest: { select: { name: true } } } },
                        interestPosts: {
                            take: 1, orderBy: { createdAt: 'desc' },
                            include: {
                                interest: { select: { name: true } },
                                media: { select: { type: true } }
                            }
                        }
                    }
                },
                user2: {
                    select: {
                        id: true, name: true, latitude: true, longitude: true, lastActiveAt: true, distanceVisibility: true, activityVisibility: true,
                        interests: { select: { interestId: true, interest: { select: { name: true } } } },
                        interestPosts: {
                            take: 1, orderBy: { createdAt: 'desc' },
                            include: {
                                interest: { select: { name: true } },
                                media: { select: { type: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const matches = matchRecords.map(record => {
            const partner = record.user1Id === userId ? record.user2 : record.user1;

            let distanceKm: number | null = null;
            if (hasLocation && partner.latitude !== null && partner.longitude !== null) {
                const distanceSq = calculateDistanceSq(
                    currentUser.latitude!, currentUser.longitude!,
                    partner.latitude, partner.longitude
                );
                distanceKm = Math.sqrt(distanceSq) * 111;
            }

            // Find shared interests
            const sharedInterests = partner.interests
                .filter((ui: any) => myInterestIds.has(ui.interestId))
                .map((ui: any) => ui.interest.name)
                .slice(0, 3); // top 3

            return {
                matchId: record.id,
                matchedAt: record.createdAt,
                id: partner.id,
                name: partner.name,
                distanceKm: partner.distanceVisibility === false ? null : distanceKm,
                distanceHidden: partner.distanceVisibility === false,
                lastActiveAt: partner.activityVisibility === false ? null : partner.lastActiveAt,
                sharedInterests: sharedInterests,
                latestPost: partner.interestPosts[0] || null
            };
        });

        return NextResponse.json({ matches }, { status: 200 });

    } catch (error) {
        console.error('Fetch Matches Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
