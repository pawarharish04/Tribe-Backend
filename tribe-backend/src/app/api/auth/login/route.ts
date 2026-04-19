import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '../../../../lib/prisma';
import { signToken } from '../../../../lib/auth';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

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

        return NextResponse.json(
            { message: 'Login successful', user: userWithoutPassword, token },
            { status: 200 }
        );
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
