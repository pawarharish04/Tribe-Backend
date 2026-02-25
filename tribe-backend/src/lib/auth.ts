import jwt from 'jsonwebtoken';

export function getUserIdFromRequest(req: Request): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    try {
        const secret = process.env.JWT_SECRET || 'default-secret-key';
        const decoded = jwt.verify(token, secret) as { userId: string };
        return decoded.userId;
    } catch (error) {
        return null;
    }
}
