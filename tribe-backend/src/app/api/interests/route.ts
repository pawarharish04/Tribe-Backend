import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';

export async function GET() {
    try {
        const interests = await prisma.interest.findMany({
            take: 50,
            orderBy: { usageCount: 'desc' },
            select: { id: true, name: true, usageCount: true }
        });
        return NextResponse.json(interests, { status: 200 });
    } catch (error) {
        console.error('Fetch Interests Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, parentId, level } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Interest name is required' }, { status: 400 });
        }

        // Upsert the interest globally
        const interest = await prisma.interest.upsert({
            where: { name },
            update: {},
            create: {
                name,
                description,
                parentId: parentId || null,
            },
        });

        // Link it to the user
        // Upsert the join table to avoid duplicate errors if the user already has it
        const userInterest = await prisma.userInterest.upsert({
            where: {
                userId_interestId: {
                    userId,
                    interestId: interest.id,
                },
            },
            update: {
                level: level || 1,
            },
            create: {
                userId,
                interestId: interest.id,
                level: level || 1,
            },
            include: {
                interest: true,
            }
        });

        return NextResponse.json({ message: 'Interest added successfully', userInterest }, { status: 201 });
    } catch (error) {
        console.error('Add Interest Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
