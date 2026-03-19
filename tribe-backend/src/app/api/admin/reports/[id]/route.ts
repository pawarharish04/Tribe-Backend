import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getAuthFromRequest } from '../../../../../lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const auth = getAuthFromRequest(req);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const body = await req.json();
        const { status } = body;

        if (!status || !['REVIEWED', 'DISMISSED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status. Must be REVIEWED or DISMISSED.' }, { status: 400 });
        }

        const updatedReport = await prisma.report.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ message: 'Report updated successfully.', report: updatedReport }, { status: 200 });

    } catch (error) {
        console.error('Admin Report PATCH Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
