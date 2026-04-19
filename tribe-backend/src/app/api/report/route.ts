import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import { parseBody, z } from '../../../lib/validate';
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit';

const ReportSchema = z.object({
    reportedId:    z.string().uuid({ message: 'reportedId must be a valid UUID.' }),
    category:      z.enum(
        ['SPAM', 'FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'OTHER'],
        { errorMap: () => ({ message: 'Invalid category. Allowed: SPAM, FAKE_PROFILE, INAPPROPRIATE_CONTENT, HARASSMENT, OTHER.' }) },
    ),
    description:   z.string().max(1000, { message: 'Description must be 1000 characters or fewer.' }).optional(),
    screenshotUrl: z.string().url({ message: 'screenshotUrl must be a valid URL.' }).optional(),
});

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Redis rate limit: 10 reports / 60 s per user ─────────────────────
        const rl = await rateLimit(userId, 'report', 10, 60);
        if (!rl.allowed) return rateLimitResponse(rl);
        // ─────────────────────────────────────────────────────────────────────

        const parsed = await parseBody(req, ReportSchema);
        if (!parsed.ok) return parsed.response;
        const { reportedId, category, description, screenshotUrl } = parsed.data;

        if (userId === reportedId) {
            return NextResponse.json({ error: 'Cannot report yourself.' }, { status: 400 });
        }

        const report = await prisma.report.create({
            data: {
                reporterId:    userId,
                reportedId,
                category:      category as any,
                description:   description ?? null,
                screenshotUrl: screenshotUrl ?? null,
                status:        'PENDING',
            }
        });

        return NextResponse.json({ message: 'Report submitted successfully.', report }, { status: 201 });

    } catch (error) {
        console.error('Report POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
