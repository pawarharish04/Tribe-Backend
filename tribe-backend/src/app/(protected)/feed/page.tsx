import { cookies } from 'next/headers';
import FeedSections from './FeedSections';
import { prisma } from '../../../lib/prisma';

export const revalidate = 0;

export default async function FeedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tribe_token')?.value;

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // For You
  const forYouRaw = await fetch(`${baseUrl}/api/feed`, {
    headers,
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);
  
  const forYou = forYouRaw?.feed || [];

  // Compatible Creators
  const compatibleCreators = await fetch(`${baseUrl}/api/recommend-creators`, {
    headers,
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  // Creative Works You Might Like
  let creativeWorks: any[] = [];
  try {
    const creativeWorksRaw = await prisma.interestPost.findMany({
      where: { mediaId: { not: null } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        user: { select: { name: true, id: true, avatarUrl: true } }
      }
    });

    creativeWorks = creativeWorksRaw.map(p => ({
      id: p.id,
      caption: p.caption,
      mediaUrl: p.media?.url,
      mediaType: p.media?.type,
      creatorName: p.user.name,
      creatorId: p.user.id,
      creatorAvatar: p.user.avatarUrl
    }));
  } catch (err) {
    console.warn('DB unavailable for creative works, using fallback:', err);
    creativeWorks = [
      {
        id: 'cw_1',
        caption: 'Generative Sand & Ink Palette Explorations 🎨',
        mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',
        mediaType: 'image',
        creatorName: 'Elena Rostova',
        creatorId: 'creator_2',
        creatorAvatar: null
      },
      {
        id: 'cw_2',
        caption: 'Building vector similarity matching with Gemini embeddings ✨',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
        mediaType: 'image',
        creatorName: 'Alex Vance',
        creatorId: 'creator_1',
        creatorAvatar: null
      }
    ];
  }

  // New Creators
  let newCreators: any[] = [];
  try {
    const newCreatorsRaw = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, avatarUrl: true, interests: { include: { interest: true } } }
    });

    newCreators = newCreatorsRaw.map(u => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      interests: u.interests.map(i => i.interest.name),
    }));
  } catch (err) {
    console.warn('DB unavailable for new creators, using fallback:', err);
    newCreators = [
      { id: 'c1', name: 'Alex Vance', avatarUrl: null, interests: ['Programming', 'AI & Machine Learning'] },
      { id: 'c2', name: 'Elena Rostova', avatarUrl: null, interests: ['UI/UX Design', 'Photography'] },
      { id: 'c3', name: 'Marcus Chen', avatarUrl: null, interests: ['Music Production', 'Filmmaking'] }
    ];
  }

  return (
    <FeedSections
      forYou={forYou}
      compatibleCreators={compatibleCreators}
      creativeWorks={creativeWorks}
      newCreators={newCreators}
    />
  );
}
