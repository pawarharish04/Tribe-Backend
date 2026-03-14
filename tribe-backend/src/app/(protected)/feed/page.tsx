import { cookies } from 'next/headers';
import FeedSections from './FeedSections';

export default async function FeedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tribe_token')?.value;
  
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch all required data using SSR
  // Cache is disabled for feed to ensure it is always up-to-date with active user token
  
  const creators = await fetch(`${baseUrl}/api/recommend-creators`, { 
    headers,
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  const photography = await fetch(`${baseUrl}/api/trending?interest=photography`, {
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  const coding = await fetch(`${baseUrl}/api/trending?interest=coding`, {
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  const music = await fetch(`${baseUrl}/api/trending?interest=music`, {
    cache: 'no-store'
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  return (
    <FeedSections
      creators={creators}
      photography={photography}
      coding={coding}
      music={music}
    />
  );
}
