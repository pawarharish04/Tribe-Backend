import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

export async function POST(req: Request) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { targetId } = body;

        if (!targetId) {
            return NextResponse.json({ error: 'Target ID required.' }, { status: 400 });
        }

        if (userId === targetId) {
            return NextResponse.json({ error: 'Cannot block yourself.' }, { status: 400 });
        }

        // Run transaction to ensure all cleanup occurs accurately
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create Block record
            const blockRecord = await tx.block.create({
                data: {
                    blockerId: userId,
                    blockedId: targetId
                }
            }).catch(async (e: any) => {
                // If it already exists it will throw unique constraint violation,
                // we can just return the existing block in that case.
                const existing = await tx.block.findUnique({
                    where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } }
                });
                if (existing) return existing;
                throw e;
            });

            // 2. Delete MatchUnlock (both directions)
            const [user1Id, user2Id] = [userId, targetId].sort();
            await tx.matchUnlock.deleteMany({
                where: {
                    user1Id: user1Id,
                    user2Id: user2Id
                }
            });

            // 3. Delete Interactions (both directions)
            await tx.interaction.deleteMany({
                where: {
                    OR: [
                        { actorId: userId, targetId: targetId },
                        { actorId: targetId, targetId: userId }
                    ]
                }
            });

            return blockRecord;
        });

        return NextResponse.json({ message: 'User blocked successfully.', block: result }, { status: 201 });

    } catch (error) {
        console.error('Block POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { targetId } = body;

        if (!targetId) {
            return NextResponse.json({ error: 'Target ID required.' }, { status: 400 });
        }

        await prisma.block.deleteMany({
            where: {
                blockerId: userId,
                blockedId: targetId
            }
        });

        return NextResponse.json({ message: 'User unblocked successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Block DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
