import { NextResponse } from 'next/server';
import { verifyToken, remainingTtl } from '../../../../lib/auth';
import { blacklistToken } from '../../../../lib/redis';
import { clearAuthCookie, COOKIE_NAME } from '../../../../lib/cookie';

/**
 * POST /api/auth/logout
 *
 * Revokes the current token (from header or cookie) by adding its jti to the
 * Redis blacklist, and clears the tribe_token cookie.
 *
 * Response: { message: string }
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

    // Always clear the cookie, even if no token was found
    const buildResponse = (msg: string, status: number) =>
        clearAuthCookie(NextResponse.json({ message: msg }, { status }));

    if (!rawToken) {
        return buildResponse('Logged out.', 200);
    }

    const payload = await verifyToken(rawToken);

    if (!payload) {
        // Token already invalid/expired — still clear the cookie
        return buildResponse('Logged out.', 200);
    }

    // Blacklist the jti for however long the token would still be valid
    await blacklistToken(payload.jti, remainingTtl(payload));

    return buildResponse('Logged out successfully.', 200);
}
