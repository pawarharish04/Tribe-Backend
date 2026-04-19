import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '../../../../lib/prisma';
import { signToken } from '../../../../lib/auth';
import { attachAuthCookie } from '../../../../lib/cookie';
import { parseBody, z } from '../../../../lib/validate';

const RegisterSchema = z.object({
    email:     z.string().email({ message: 'Must be a valid email address.' }),
    password:  z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    name:      z.string().optional(),
    latitude:  z.number().optional(),
    longitude: z.number().optional(),
    interests: z
        .array(z.string())
        .min(3, { message: 'Please select at least 3 interests to build your network.' }),
});

export async function POST(req: Request) {
    try {
        const parsed = await parseBody(req, RegisterSchema);
        if (!parsed.ok) return parsed.response;
        const { email, password, name, latitude, longitude, interests } = parsed.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Resolve globally tracked interests, incrementing ranking usage metrics
        const dbInterests = await Promise.all(
            interests.map((iName: string) => prisma.interest.upsert({
                where:  { name: iName },
                update: { usageCount: { increment: 1 } },
                create: { name: iName, usageCount: 1 },
            }))
        );

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                latitude,
                longitude,
                interests: {
                    create: dbInterests.map(i => ({ interestId: i.id }))
                }
            },
        });

        const { password: _, ...userWithoutPassword } = newUser;

        // Sign with jti + iat + exp via centralised helper
        const token = signToken(newUser.id, newUser.role);

        // Return token in body (for API / mobile clients) AND as an httpOnly
        // cookie (for browser-based navigation / middleware checks).
        const response = NextResponse.json(
            { message: 'Registration successful', user: userWithoutPassword, token },
            { status: 201 }
        );
        return attachAuthCookie(response, token);
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
