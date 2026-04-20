import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Middleware runs in the Edge runtime — use `jose` (Web Crypto API) ────────
// We cannot import `jsonwebtoken` or `@upstash/redis` here because they use
// Node.js APIs not available in the Edge runtime.
// The middleware only checks SIGNATURE + EXPIRY.  Blacklist enforcement is
// handled by getAuthFromRequest() in each API route handler (Node runtime).

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');
const COOKIE_NAME = 'tribe_token';

async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
    // 1. Prefer Authorization: Bearer header (API / mobile clients)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    // 2. Fall back to httpOnly cookie (browser-originated page navigation)
    const cookie = request.cookies.get(COOKIE_NAME);
    return cookie?.value ?? null;
}

export async function proxy(request: NextRequest) {
    const token = await getTokenFromRequest(request);

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Verify signature and expiry using the Edge-compatible `jose` library.
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch {
        // Token is invalid or expired — clear the stale cookie and redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
        return response;
    }
}

export const config = {
    matcher: ['/feed', '/matches', '/profile/:path*', '/activity', '/onboarding'],
};
