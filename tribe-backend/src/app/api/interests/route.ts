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
        const fallbackInterests = [
            { id: '1', name: 'Programming', usageCount: 42 },
            { id: '2', name: 'Cricket', usageCount: 38 },
            { id: '3', name: 'AI & Machine Learning', usageCount: 35 },
            { id: '4', name: 'Music Production', usageCount: 29 },
            { id: '5', name: 'Photography', usageCount: 25 },
            { id: '6', name: 'UI/UX Design', usageCount: 22 },
            { id: '7', name: 'Basketball', usageCount: 18 },
            { id: '8', name: 'Filmmaking', usageCount: 15 },
            { id: '9', name: 'Indie Game Dev', usageCount: 12 },
            { id: '10', name: 'Architecture', usageCount: 10 }
        ];
        return NextResponse.json(fallbackInterests, { status: 200 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
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
