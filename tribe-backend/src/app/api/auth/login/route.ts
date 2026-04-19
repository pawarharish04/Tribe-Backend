import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '../../../../lib/prisma';
import { signToken } from '../../../../lib/auth';
import { attachAuthCookie } from '../../../../lib/cookie';
import { parseBody, z } from '../../../../lib/validate';

const LoginSchema = z.object({
    email:    z.string().email({ message: 'Must be a valid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

export async function POST(req: Request) {
    try {
        const parsed = await parseBody(req, LoginSchema);
        if (!parsed.ok) return parsed.response;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Update lastActiveAt on successful login
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data:  { lastActiveAt: new Date() },
        });

        const { password: _, ...userWithoutPassword } = updatedUser;

        // Sign with jti + iat + exp via centralised helper
        const token = signToken(user.id, user.role);

        // Return token in body (for API / mobile clients) AND as an httpOnly
        // cookie (for browser-based navigation / middleware checks).
        const response = NextResponse.json(
            { message: 'Login successful', user: userWithoutPassword, token },
            { status: 200 }
        );
        return attachAuthCookie(response, token);
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
