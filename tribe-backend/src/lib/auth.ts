import jwt from 'jsonwebtoken';

// Fail fast at startup — never silently fall back to an insecure default.
if (!process.env.JWT_SECRET) {
    throw new Error(
        '[auth] JWT_SECRET environment variable is not set. ' +
        'Set it in your .env file and restart the server.',
    );
}

const JWT_SECRET = process.env.JWT_SECRET;

export function getUserIdFromRequest(req: Request): string | null {
    const auth = getAuthFromRequest(req);
    return auth?.userId || null;
}

export function getAuthFromRequest(req: Request): { userId: string, role: string } | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
        return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
        return null;
    }
}
