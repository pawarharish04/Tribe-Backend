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
        const { targetId, category, description, screenshotUrl } = body;

        if (!targetId || !category) {
            return NextResponse.json({ error: 'Target ID and Category required.' }, { status: 400 });
        }

        const validCategories = ['SPAM', 'FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'OTHER'];
        if (!validCategories.includes(category)) {
            return NextResponse.json({ error: 'Invalid Category.' }, { status: 400 });
        }

        if (userId === targetId) {
            return NextResponse.json({ error: 'Cannot report yourself.' }, { status: 400 });
        }

        const report = await prisma.report.create({
            data: {
                reporterId: userId,
                reportedId: targetId,
                category: category as any,
                description: description || null,
                screenshotUrl: screenshotUrl || null,
                status: 'PENDING'
            }
        });

        return NextResponse.json({ message: 'Report submitted successfully.', report }, { status: 201 });

    } catch (error) {
        console.error('Report POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
