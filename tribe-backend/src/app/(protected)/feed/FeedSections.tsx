'use client';

import { T } from '../../../design/tokens';
import FeedSection from '../../../components/feed/FeedSection';
import CreatorCard from '../../../components/feed/CreatorCard';
import WorkCard from '../../../components/feed/WorkCard';
import FeedSkeleton from '../../../components/feed/FeedSkeleton';

export default function FeedSections({ 
  creators, 
  photography, 
  coding, 
  music 
}: { 
  creators: any[]; 
  photography: any[]; 
  coding: any[]; 
  music: any[]; 
}) {

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

                <div className="space-y-10" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    
                    {/* 1. Creators Similar to You */}
                    <FeedSection title="Creators Similar to You" link="/discover/creators">
                        {!creators ? <FeedSkeleton /> : creators.map((c: any) => (
                            <CreatorCard key={c.id || c.userId} creator={c} />
                        ))}
                    </FeedSection>

                    {/* 2. Trending Photography */}
                    <FeedSection title="Trending Photography" link="/discover/photography">
                        {!photography ? <FeedSkeleton /> : photography.map((p: any) => (
                            <WorkCard key={p.id} post={p} />
                        ))}
                    </FeedSection>

                    {/* 3. Coding Creators */}
                    <FeedSection title="Coding Creators" link="/discover/coding">
                        {!coding ? <FeedSkeleton /> : coding.map((p: any) => (
                            <WorkCard key={p.id} post={p} />
                        ))}
                    </FeedSection>

                    {/* 4. Music Creators */}
                    <FeedSection title="Music Creators" link="/discover/music">
                        {!music ? <FeedSkeleton /> : music.map((p: any) => (
                            <WorkCard key={p.id} post={p} />
                        ))}
                    </FeedSection>
                    
                </div>
            </main>
        </div>
    );
}
