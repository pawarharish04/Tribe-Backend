import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthFromRequest } from '../../../../lib/auth';

export async function GET(req: Request) {
    try {
        const auth = getAuthFromRequest(req);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const reports = await prisma.report.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                reported: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ reports }, { status: 200 });

    } catch (error) {
        console.error('Admin Reports GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
