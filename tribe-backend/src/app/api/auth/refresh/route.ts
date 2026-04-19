import { NextResponse } from 'next/server';
import { verifyToken, signToken, remainingTtl } from '../../../../lib/auth';
import { blacklistToken } from '../../../../lib/redis';
import { attachAuthCookie, COOKIE_NAME } from '../../../../lib/cookie';

/**
 * POST /api/auth/refresh
 *
 * Accepts a valid (non-blacklisted) token from either the Authorization header
 * or the tribe_token cookie. Blacklists the old jti (token rotation) and
 * issues a fresh 7-day token — returned in both the JSON body and a new cookie.
 *
 * Response: { token: string }
 */
export async function POST(req: Request) {
    // Accept token from header OR cookie
    const authHeader = req.headers.get('authorization');
    const cookieHeader = req.headers.get('cookie');

    let rawToken: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
        rawToken = authHeader.split(' ')[1];
    } else if (cookieHeader) {
        const match = cookieHeader
            .split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${COOKIE_NAME}=`));
        if (match) rawToken = match.slice(COOKIE_NAME.length + 1);
    }

    if (!rawToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const response = NextResponse.json({ token: newToken }, { status: 200 });
    return attachAuthCookie(response, newToken);
}
