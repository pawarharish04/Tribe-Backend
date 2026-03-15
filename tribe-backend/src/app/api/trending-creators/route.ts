import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Query Prisma DB
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { interestPosts: { some: { createdAt: { gte: sevenDaysAgo } } } },
          { receivedInteractions: { some: { createdAt: { gte: sevenDaysAgo } } } }
        ]
      },
      include: {
        interests: {
          include: {
            interest: true
          }
        },
        interestPosts: {
          where: { createdAt: { gte: sevenDaysAgo } },
          include: {
            _count: {
              select: { likes: true }
            }
          }
        },
        _count: {
          select: {
            receivedInteractions: {
              where: { createdAt: { gte: sevenDaysAgo } }
            }
          }
        }
      }
    });

    const creators = users.map(user => {
      const recentPosts = user.interestPosts.length;
      const likes = user.interestPosts.reduce((sum, post) => sum + post._count.likes, 0);
      const profileActivity = user._count.receivedInteractions;

      const score = (likes * 0.6) + (recentPosts * 0.3) + (profileActivity * 0.1);

      return {
        id: user.id,
        name: user.name || 'Anonymous',
        avatar: user.avatarUrl || '/avatar.png',
        interests: user.interests.map((ui: any) => ui.interest.name),
        score: parseFloat(score.toFixed(1))
      };
    }).filter(c => c.score > 0);

    // Sort descending by score
    creators.sort((a, b) => b.score - a.score);

    // Return top 10 creators
    return NextResponse.json(creators.slice(0, 10));
  } catch (error) {
    console.error("Error fetching trending creators:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
