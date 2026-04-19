import { NextResponse } from 'next/server';
import { verifyToken, remainingTtl } from '../../../../lib/auth';
import { blacklistToken } from '../../../../lib/redis';

/**
 * POST /api/auth/logout
 *
 * Revokes the current Bearer token by adding its jti to the Redis blacklist
 * with a TTL matching the token's remaining valid time.  After this call,
 * any request presenting the same token will be rejected by await getAuthFromRequest().
 *
 * Body: none — token is read from the Authorization header.
 * Response: { message: string }
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawToken = authHeader.split(' ')[1];
    const payload = await verifyToken(rawToken);

    if (!payload) {
        // Token is already invalid/expired — treat as a successful logout
        return NextResponse.json({ message: 'Logged out.' }, { status: 200 });
    }

    // Blacklist the jti for however long the token would still be valid
    const ttl = remainingTtl(payload);
    await blacklistToken(payload.jti, ttl);

    return NextResponse.json({ message: 'Logged out successfully.' }, { status: 200 });
}
