import { NextResponse } from 'next/server';

export const COOKIE_NAME = 'tribe_token';

// Cookie lifetime aligned with JWT expiry (7 days in seconds)
const MAX_AGE = 7 * 24 * 60 * 60; // 604800 s

/**
 * Attach the `tribe_token` httpOnly cookie to an existing NextResponse.
 * Call this after building the JSON response in login, register, and refresh.
 */
export function attachAuthCookie(response: NextResponse, token: string): NextResponse {
    response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,                                               // inaccessible to JS
        secure:   process.env.NODE_ENV === 'production',             // HTTPS only in prod
        sameSite: 'strict',                                          // no cross-site sends
        path:     '/',
        maxAge:   MAX_AGE,
    });
    return response;
}

/**
 * Clear the `tribe_token` cookie (set MaxAge=0 / expires in the past).
 * Attach to the logout response.
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
    response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path:     '/',
        maxAge:   0,
    });
    return response;
}
