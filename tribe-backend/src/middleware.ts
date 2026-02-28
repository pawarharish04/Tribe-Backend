import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Simple check for presence of token cookie
    const token = request.cookies.get('tribe_token');

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        // Optional: add ?redirect param
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/feed', '/matches', '/profile/:path*'],
};
