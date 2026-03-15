import { cookies } from 'next/headers';
import FeedSections from './FeedSections';
import { prisma } from '../../../lib/prisma';

export const revalidate = 0; // Disable static caching

export default async function FeedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tribe_token')?.value;
  
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch all required data using SSR
  // Cache is disabled for feed to ensure it is always up-to-date with active user token

  const forYouRaw = await fetch(`${baseUrl}/api/feed`, { 
    headers,
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);
  
  const forYou = forYouRaw?.feed || [];

  const compatibleCreators = await fetch(`${baseUrl}/api/recommend-creators`, { 
    headers,
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  const creativeWorksRaw = await prisma.interestPost.findMany({
    where: { mediaId: { not: null } },
    take: 10,
    orderBy: { createdAt: 'desc' }, // Fresh content
    include: {
      media: true,
      user: { select: { name: true, id: true, avatarUrl: true } }
    }
  });

  const creativeWorks = creativeWorksRaw.map(p => ({
    id: p.id,
    caption: p.caption,
    mediaUrl: p.media?.url,
    mediaType: p.media?.type,
    creatorName: p.user.name,
    creatorId: p.user.id,
    creatorAvatar: p.user.avatarUrl
  }));

  const newCreatorsRaw = await prisma.user.findMany({
    where: { avatarUrl: { not: null } },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, avatarUrl: true, interests: { include: { interest: true } } }
  });

  const newCreators = newCreatorsRaw.map(u => ({
    id: u.id,
    name: u.name,
    avatarUrl: u.avatarUrl,
    interests: u.interests.map(i => i.interest.name),
  }));

  return (
    <FeedSections
      forYou={forYou}
      compatibleCreators={compatibleCreators}
      creativeWorks={creativeWorks}
      newCreators={newCreators}
    />
  );
}
