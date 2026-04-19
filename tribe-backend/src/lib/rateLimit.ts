import { redis } from './redis';

export interface RateLimitResult {
    allowed:   boolean;
    remaining: number;
    limit:     number;
    resetIn:   number; // seconds until the current window resets
}

/**
 * Fixed-window Redis rate limiter.
 *
 * Algorithm:
 *   1. INCR the key (atomic counter).
 *   2. On first write (count === 1) set the TTL via EXPIRE so the window
 *      self-resets in Redis without a separate cleanup job.
 *   3. Compare the count to `limit`.
 *
 * Key format:  ratelimit:{action}:{userId}
 * Example:     ratelimit:interactions:usr_abc123
 *
 * @param userId        The authenticated user performing the action.
 * @param action        A short label that scopes the limit (e.g. "interactions").
 * @param limit         Max requests allowed in the window (default 60).
 * @param windowSeconds Length of the window in seconds (default 60).
 */
export async function rateLimit(
    userId:        string,
    action:        string,
    limit:         number = 60,
    windowSeconds: number = 60,
): Promise<RateLimitResult> {
    const key = `ratelimit:${action}:${userId}`;

    // Atomic increment — returns the new counter value
    const count = await redis.incr(key);

    // Set TTL only on the first request of each window so the key
    // self-expires and never accumulates stale data.
    if (count === 1) {
        await redis.expire(key, windowSeconds);
    }

    // Fetch the remaining TTL so callers can populate Retry-After headers
    const ttl = await redis.ttl(key);
    const resetIn = ttl > 0 ? ttl : windowSeconds;

    return {
        allowed:   count <= limit,
        remaining: Math.max(0, limit - count),
        limit,
        resetIn,
    };
}

/**
 * Build a 429 NextResponse with standard rate-limit headers.
 * Import from this module instead of constructing ad hoc in routes.
 */
export function rateLimitResponse(result: RateLimitResult) {
    const { NextResponse } = require('next/server');          // lazy — avoids Edge issues
    return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests — please try again later.' },
        {
            status:  429,
            headers: {
                'X-RateLimit-Limit':     String(result.limit),
                'X-RateLimit-Remaining': '0',
                'Retry-After':           String(result.resetIn),
            },
        },
    );
}
