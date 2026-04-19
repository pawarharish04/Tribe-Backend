import { Redis } from '@upstash/redis';

// Validated at startup by env.ts (imported via prisma.ts).
// Exported as a singleton so the HTTP connection pool is reused across requests.
export const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Blacklist helpers ────────────────────────────────────────────────────────
const BLACKLIST_PREFIX = 'jwt:blacklist:';

/**
 * Add a jti to the Redis blacklist.
 * @param jti   The JWT ID claim value.
 * @param ttlSeconds  Seconds until the token would naturally expire.
 */
export async function blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return; // already expired — no need to store
    await redis.set(`${BLACKLIST_PREFIX}${jti}`, '1', { ex: ttlSeconds });
}

/**
 * Returns true if the jti has been blacklisted (i.e. logged out).
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
    const val = await redis.get(`${BLACKLIST_PREFIX}${jti}`);
    return val !== null;
}
