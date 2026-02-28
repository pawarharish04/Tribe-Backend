import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, password, name, latitude, longitude, interests } = await req.json();

        if (!interests || !Array.isArray(interests) || interests.length < 3) {
            return NextResponse.json(
                { error: 'Please select at least 3 interests to build your network.' },
                { status: 400 }
            );
        }

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Resolve globally tracked interests, incrementing ranking usage metrics
        const dbInterests = await Promise.all(
            interests.map((iName: string) => prisma.interest.upsert({
                where: { name: iName },
                update: { usageCount: { increment: 1 } },
                create: { name: iName, usageCount: 1 }
            }))
        );

        // Create the user
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

        // Don't return the password
        const { password: _, ...userWithoutPassword } = newUser;

        // Auto-generate Token
        const secret = process.env.JWT_SECRET || 'default-secret-key';
        const token = jwt.sign(
            { userId: newUser.id },
            secret,
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            message: 'Registration successful',
            user: userWithoutPassword,
            token
        }, { status: 201 });
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
