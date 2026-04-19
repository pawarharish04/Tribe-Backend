import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest } from '../../../../lib/auth';

export async function DELETE(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
