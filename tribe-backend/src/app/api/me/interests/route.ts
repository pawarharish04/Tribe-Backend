import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';

// Strength levels: 1 = CURIOUS, 2 = SERIOUS, 3 = CORE
const VALID_LEVELS = [1, 2, 3];

// ─── PATCH /api/me/interests ──────────────────────────────────────────────────
// Body: { interests: [{ interestId: string, level: 1|2|3 }] }
// Replaces the user's interest list with the provided one.

export async function PATCH(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const items: { interestId: string; level: number }[] = body.interests ?? [];

    if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'interests must be an array' }, { status: 400 });
    }

    // Validate
    for (const item of items) {
        if (!item.interestId || !VALID_LEVELS.includes(item.level)) {
            return NextResponse.json(
                { error: `Invalid entry: ${JSON.stringify(item)}` },
                { status: 400 }
            );
        }
    }

    // Upsert each interest, delete removed ones — all in one transaction
    await prisma.$transaction(async (tx: any) => {
        const incoming = new Set(items.map(i => i.interestId));

        // Delete interests not in the new list
        await tx.userInterest.deleteMany({
            where: {
                userId,
                interestId: { notIn: Array.from(incoming) },
            },
        });

        // Upsert each
        for (const item of items) {
            await tx.userInterest.upsert({
                where: { userId_interestId: { userId, interestId: item.interestId } },
                update: { level: item.level },
                create: { userId, interestId: item.interestId, level: item.level },
            });
        }
    });

    const updated = await prisma.userInterest.findMany({
        where: { userId },
        select: {
            id: true,
            level: true,
            interest: { select: { id: true, name: true } },
        },
        orderBy: { level: 'desc' },
    });

    return NextResponse.json({ interests: updated });
}
