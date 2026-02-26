import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { calculateDistanceSq, calculateInterestScore, calculateFinalMatchScore, getDistanceFactor } from '../../../lib/matching';
import jwt from 'jsonwebtoken';

const NUM_USERS = 50;
const BASE_LAT = 37.7749; // Mock Origin (San Francisco)
const BASE_LON = -122.4194;
const MAX_LAT_OFFSET = 1.0; // up to ~111km away
const MAX_LON_OFFSET = 1.0;

const interestTreeData = {
    'Sports': ['Cricket', 'Football', 'Basketball'],
    'Tech': ['Programming', 'AI', 'Hardware'],
    'Music': ['Jazz', 'Rock', 'Pop'],
};

function randomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomItems<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export async function GET() {
    try {
        const existingInterests = await prisma.interest.findMany();
        const existingMap = new Map(existingInterests.map(i => [i.name, i]));

        for (const [parentName, children] of Object.entries(interestTreeData)) {
            let parent = existingMap.get(parentName);
            if (!parent) {
                parent = await prisma.interest.create({ data: { name: parentName } });
                existingMap.set(parent.name, parent);
            }

            for (const childName of children) {
                if (!existingMap.has(childName)) {
                    const child = await prisma.interest.create({
                        data: { name: childName, parentId: parent.id }
                    });
                    existingMap.set(child.name, child);
                }
            }
        }

        await prisma.user.deleteMany({
            where: { email: { startsWith: 'mock_' } }
        });

        const allInterests = Array.from(existingMap.values());
        const usersData = [];

        for (let i = 0; i < NUM_USERS; i++) {
            const latOffset = randomFloat(-MAX_LAT_OFFSET, MAX_LAT_OFFSET);
            const lonOffset = randomFloat(-MAX_LON_OFFSET, MAX_LON_OFFSET);

            usersData.push({
                id: `mock_user_${i}`,
                email: `mock_${i}@test.com`,
                password: 'password123',
                name: `Synthetic User #${i}`,
                latitude: BASE_LAT + latOffset,
                longitude: BASE_LON + lonOffset,
            });
        }

        await prisma.user.createMany({ data: usersData });

        const userInterestInserts = [];
        for (let i = 0; i < NUM_USERS; i++) {
            const userId = `mock_user_${i}`;
            const numInterests = randomInt(1, 4);
            const chosen = pickRandomItems(allInterests, numInterests);

            for (const interest of chosen) {
                userInterestInserts.push({
                    userId,
                    interestId: interest.id,
                    level: randomInt(1, 3)
                });
            }
        }
        await prisma.userInterest.createMany({ data: userInterestInserts });

        const testOriginUser = await prisma.user.create({
            data: {
                id: 'mock_test_origin',
                email: 'mock_test_origin@test.com',
                password: 'password123',
                name: 'Testing Observer',
                latitude: BASE_LAT,
                longitude: BASE_LON,
                interests: {
                    create: [
                        { interestId: existingMap.get('Cricket')!.id, level: 3 },
                        { interestId: existingMap.get('Programming')!.id, level: 3 },
                        { interestId: existingMap.get('Music')!.id, level: 2 },
                    ]
                }
            },
            include: {
                interests: { select: { interestId: true, level: true, interest: { select: { parentId: true } } } }
            }
        });

        const token = jwt.sign({ userId: testOriginUser.id }, process.env.JWT_SECRET || 'default-secret-key');

        const feedPool = await prisma.user.findMany({
            where: { id: { startsWith: 'mock_user_' } },
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                interests: {
                    select: {
                        interestId: true,
                        level: true,
                        interest: { select: { name: true, parentId: true } }
                    }
                }
            }
        });

        const evaluated = feedPool.map(u => {
            let distanceSq: number | null = null;
            if (testOriginUser.latitude !== null && testOriginUser.longitude !== null && u.latitude !== null && u.longitude !== null) {
                distanceSq = calculateDistanceSq(
                    testOriginUser.latitude, testOriginUser.longitude,
                    u.latitude, u.longitude
                );
            }

            const breakdown = calculateInterestScore(testOriginUser.interests as any, u.interests as any);
            const finalScore = calculateFinalMatchScore(breakdown.score, distanceSq);

            const distanceKm = distanceSq !== null ? Math.sqrt(distanceSq) * 111 : 0;
            const distanceFactor = distanceSq !== null ? getDistanceFactor(distanceKm) : 1.0;

            return {
                name: u.name,
                approxKm: distanceSq !== null ? distanceKm.toFixed(1) : '?',
                interestScore: breakdown.score,
                distanceFactor: distanceFactor.toFixed(2),
                finalScore: Math.round(finalScore),
                exactMatches: breakdown.exactMatches,
                interests: u.interests.map(i => i.interest.name).join(', ')
            };
        }).sort((a, b) => b.finalScore - a.finalScore);

        const top10 = evaluated.slice(0, 10);

        const buckets: Record<string, number> = {
            "80+ ": 0,
            "60-79": 0,
            "40-59": 0,
            "20-39": 0,
            "0-19 ": 0
        };

        evaluated.forEach(u => {
            if (u.finalScore >= 80) buckets["80+ "]++;
            else if (u.finalScore >= 60) buckets["60-79"]++;
            else if (u.finalScore >= 40) buckets["40-59"]++;
            else if (u.finalScore >= 20) buckets["20-39"]++;
            else buckets["0-19 "]++;
        });

        return NextResponse.json({
            message: "Synthetic dataset seeded successfully. You can now use the debug JWT token.",
            jwt: token,
            testUserCoordinates: { lat: BASE_LAT, lon: BASE_LON },
            testUserInterests: ['Cricket (Level 3)', 'Programming (Level 3)', 'Music (Level 2)'],
            histogram: buckets,
            top10Matches: top10
        }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error occurred seeding.' }, { status: 500 });
    }
}
