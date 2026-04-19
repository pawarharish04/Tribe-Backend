import { NextResponse } from 'next/server';
import { verifyToken, signToken, remainingTtl } from '../../../../lib/auth';
import { blacklistToken } from '../../../../lib/redis';

/**
 * POST /api/auth/refresh
 *
 * Accepts a valid (non-blacklisted) Bearer token and returns a brand-new
 * token with a fresh 7-day expiry.  The old token is immediately blacklisted
 * so it cannot be reused (token rotation).
 *
 * Body: none — token is read from the Authorization header.
 * Response: { token: string }
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawToken = authHeader.split(' ')[1];
    const payload = await verifyToken(rawToken);

    if (!payload) {
        return NextResponse.json(
            { error: 'Token is invalid, expired, or has already been revoked.' },
            { status: 401 },
        );
    }

    // Blacklist the old token for whatever time it had left
    const ttl = remainingTtl(payload);
    await blacklistToken(payload.jti, ttl);

    // Issue a fresh token (new jti, new iat/exp)
    const newToken = signToken(payload.userId, payload.role);

    return NextResponse.json({ token: newToken }, { status: 200 });
}
