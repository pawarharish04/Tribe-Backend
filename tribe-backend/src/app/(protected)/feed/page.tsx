'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '../../../design/tokens';
import FeedSection from '../../../components/feed/FeedSection';
import CreatorCard from '../../../components/feed/CreatorCard';
import WorkCard from '../../../components/feed/WorkCard';

export default function FeedPage() {
    const [jwt, setJwt] = useState('');
    const [creators, setCreators] = useState<any[]>([]);
    const [photography, setPhotography] = useState<any[]>([]);
    const [coding, setCoding] = useState<any[]>([]);
    const [music, setMusic] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (stored) {
            setJwt(stored);
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (!jwt) return;

        const loadFeedData = async () => {
            setLoading(true);
            try {
                // Fetch recommended creators (Compatibility Engine)
                const creatorsPromise = fetch('/api/recommend-creators', {
                    headers: { 'Authorization': `Bearer ${jwt}` }
                }).then(r => r.ok ? r.json() : []);

                // Fetch trending posts
                const photoPromise = fetch('/api/trending?interest=photography').then(r => r.ok ? r.json() : []);
                const codingPromise = fetch('/api/trending?interest=coding').then(r => r.ok ? r.json() : []);
                const musicPromise = fetch('/api/trending?interest=music').then(r => r.ok ? r.json() : []);

                const [creatorsData, photoData, codingData, musicData] = await Promise.all([
                    creatorsPromise, photoPromise, codingPromise, musicPromise
                ]);

                setCreators(creatorsData || []);
                setPhotography(photoData || []);
                setCoding(codingData || []);
                setMusic(musicData || []);
            } catch (err) {
                console.error("Failed to load feed", err);
            } finally {
                setLoading(false);
            }
        };

        loadFeedData();
    }, [jwt]);

    return (
        <div style={{ minHeight: '100vh', background: T.cream, paddingTop: '40px', paddingBottom: '100px' }}>
            <main style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>

                {/* Header */}
                <div style={{ padding: '0 20px', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '32px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.ink, letterSpacing: '-0.03em', marginBottom: '6px' }}>
                        Discover
                    </h1>
                    <p style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, lineHeight: 1.6 }}>
                        Explore the network curated heavily by your personal interests and creative rhythm.
                    </p>
                </div>

                {loading ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: T.inkFaint, fontFamily: 'Georgia,serif' }}>
                        <div style={{ animation: 'sUp 0.8s ease-in-out infinite alternate', fontSize: '24px', opacity: 0.5 }}>...</div>
                        <div style={{ marginTop: '12px' }}>Curating your network...</div>
                    </div>
                ) : (
                    <div className="space-y-10" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                        {/* Creators Section */}
                        {creators.length > 0 && (
                            <FeedSection title="Creators Similar to You" link="/discover/creators">
                                {creators.map((c: any) => (
                                    <CreatorCard key={c.id || c.userId} creator={c} />
                                ))}
                            </FeedSection>
                        )}

                        {/* Photography Section */}
                        {photography.length > 0 && (
                            <FeedSection title="Photography" link="/discover/photography">
                                {photography.map((p: any) => (
                                    <WorkCard key={p.id} post={p} />
                                ))}
                            </FeedSection>
                        )}

                        {/* Coding Section */}
                        {coding.length > 0 && (
                            <FeedSection title="Coding" link="/discover/coding">
                                {coding.map((p: any) => (
                                    <WorkCard key={p.id} post={p} />
                                ))}
                            </FeedSection>
                        )}

                        {/* Music Section */}
                        {music.length > 0 && (
                            <FeedSection title="Music" link="/discover/music">
                                {music.map((p: any) => (
                                    <WorkCard key={p.id} post={p} />
                                ))}
                            </FeedSection>
                        )}

                    </div>
                )}
            </main>
        </div>
    );
}
