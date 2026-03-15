'use client';

import { T } from '../../../design/tokens';
import FeedSection from '../../../components/feed/FeedSection';
import CreatorCard from '../../../components/feed/CreatorCard';
import WorkCard from '../../../components/feed/WorkCard';
import FeedSkeleton from '../../../components/feed/FeedSkeleton';

export default function FeedSections({ 
  forYou,
  compatibleCreators, 
  creativeWorks, 
  newCreators 
}: { 
  forYou: any[];
  compatibleCreators: any[]; 
  creativeWorks: any[]; 
  newCreators: any[]; 
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
                    
                    {/* 1. For You */}
                    <FeedSection title="For You" link="/discover/foryou">
                        {!forYou || forYou.length === 0 ? <FeedSkeleton /> : forYou.map((c: any) => (
                            <CreatorCard key={c.id || c.userId} creator={c} />
                        ))}
                    </FeedSection>

                    {/* 2. Compatible Creators */}
                    <FeedSection title="Compatible Creators" link="/discover/creators">
                        {!compatibleCreators || compatibleCreators.length === 0 ? <FeedSkeleton /> : compatibleCreators.map((c: any) => (
                            <CreatorCard key={c.id || c.userId} creator={c} />
                        ))}
                    </FeedSection>

                    {/* 3. Creative Works You Might Like */}
                    <FeedSection title="Creative Works You Might Like" link="/discover/works">
                        {!creativeWorks || creativeWorks.length === 0 ? <FeedSkeleton /> : creativeWorks.map((p: any) => (
                            <WorkCard key={p.id} post={p} />
                        ))}
                    </FeedSection>

                    {/* 4. New Creators */}
                    <FeedSection title="New Creators" link="/discover/new">
                        {!newCreators || newCreators.length === 0 ? <FeedSkeleton /> : newCreators.map((c: any) => (
                            <CreatorCard key={c.id || c.userId} creator={c} />
                        ))}
                    </FeedSection>
                    
                </div>
            </main>
        </div>
    );
}
