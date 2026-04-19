import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Lightweight liveness probe used by Docker HEALTHCHECK and load balancers.
 * Returns 200 as long as the Next.js process is alive.
 * Does NOT check DB or Redis — those are startup concerns handled by env.ts.
 */
export async function GET() {
    return NextResponse.json(
        { status: 'ok', timestamp: new Date().toISOString() },
        { status: 200 },
    );
}
