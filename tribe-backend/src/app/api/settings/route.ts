import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import bcrypt from 'bcrypt';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            distanceVisibility: true,
            activityVisibility: true,
        },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ settings: user });
}

export async function PATCH(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { password, distanceVisibility, activityVisibility } = body;

    const data: any = {};
    if (distanceVisibility !== undefined) data.distanceVisibility = Boolean(distanceVisibility);
    if (activityVisibility !== undefined) data.activityVisibility = Boolean(activityVisibility);

    if (password) {
        if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            distanceVisibility: true,
            activityVisibility: true,
        },
    });

    return NextResponse.json({ settings: updated, message: 'Settings updated successfully' });
}
