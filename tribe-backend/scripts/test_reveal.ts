import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log("Seeding...");
    let r = await fetch('http://localhost:3000/api/seed');
    let j = await r.json();
    let jwt = j.jwt;

    console.log("Fetching first feed...");
    let feedRes1 = await fetch('http://localhost:3000/api/feed', { headers: { Authorization: 'Bearer ' + jwt } });
    let feed1 = await feedRes1.json();

    if (!feed1.feed || feed1.feed.length === 0) {
        console.error("No feed found");
        return;
    }
    const topCandidate = feed1.feed[0];

    console.log(`Unlocking match for candidate: ${topCandidate.id}`);
    await prisma.matchUnlock.create({ data: { user1Id: 'mock_test_origin', user2Id: topCandidate.id } });

    console.log("Fetching second feed...");
    let feedRes2 = await fetch('http://localhost:3000/api/feed', { headers: { Authorization: 'Bearer ' + jwt } });
    let feed2 = await feedRes2.json();

    const revealedUser = feed2.feed.find((f: any) => f.id === topCandidate.id);
    const lockedUser = feed2.feed.find((f: any) => f.id !== topCandidate.id);

    console.log('\n--- REVEALED CANDIDATE ---');
    console.log(JSON.stringify(revealedUser, null, 2));

    console.log('\n--- LOCKED CANDIDATE ---');
    console.log(JSON.stringify(lockedUser, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
