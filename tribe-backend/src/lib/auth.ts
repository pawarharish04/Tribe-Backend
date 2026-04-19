import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { isTokenBlacklisted } from './redis';

// Fail fast at startup — never silently fall back to an insecure default.
if (!process.env.JWT_SECRET) {
    throw new Error(
        '[auth] JWT_SECRET environment variable is not set. ' +
        'Set it in your .env file and restart the server.',
    );
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 604800 s

// ─── Token payload shape ──────────────────────────────────────────────────────
export interface JwtPayload {
    userId: string;
    role:   string;
    jti:    string;  // JWT ID — used as the blacklist key
    iat:    number;  // issued-at (injected by jsonwebtoken)
    exp:    number;  // expiry   (injected by jsonwebtoken)
}

// ─── Sign ─────────────────────────────────────────────────────────────────────
/**
 * Create a signed JWT with jti + iat + exp claims.
 * Use this in login, register, and refresh routes instead of calling
 * jwt.sign() directly.
 */
export function signToken(userId: string, role: string = 'user'): string {
    return jwt.sign(
        { userId, role, jti: randomUUID() },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY },
    );
}

/**
 * Number of seconds remaining until the token expires.
 * Returns 0 if already expired.
 */
export function remainingTtl(payload: JwtPayload): number {
    return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

// ─── Verify (async — checks Redis blacklist) ──────────────────────────────────
/**
 * Verify a raw token string.
 * Returns the decoded payload or null if invalid / expired / blacklisted.
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }

    // Reject if the jti has been blacklisted (logged out)
    if (decoded.jti && await isTokenBlacklisted(decoded.jti)) {
        return null;
    }

    return decoded;
}

// ─── Request helpers ──────────────────────────────────────────────────────────
function extractRawToken(req: Request): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
}

export async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const auth = await getAuthFromRequest(req);
    return auth?.userId ?? null;
}

export async function getAuthFromRequest(
    req: Request,
): Promise<{ userId: string; role: string } | null> {
    const token = extractRawToken(req);
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    return { userId: payload.userId, role: payload.role };
}

// Re-export constants so routes don't need to hard-code them
export { JWT_EXPIRY, JWT_EXPIRY_SECONDS };
