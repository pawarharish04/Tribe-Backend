import { T } from '../../../../design/tokens';
import CreatorCard from '../../../../components/feed/CreatorCard';
import { cookies } from 'next/headers';

export default async function TrendingCreatorsPage() {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    const trendingCreators = await fetch(`${baseUrl}/api/trending-creators`, { 
        next: { revalidate: 60 }
    }).then(r => r.ok ? r.json() : []).catch(() => []);

    return (
        <div style={{ minHeight: '100vh', background: T.cream, padding: '40px 20px 80px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', borderBottom: `1px solid ${T.sep}`, paddingBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.ink, letterSpacing: '-0.03em', marginBottom: '6px' }}>Trending Creators</h1>
                <p style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, lineHeight: 1.6 }}>
                    Surface creators who are currently gaining engagement and traction across the network.
                </p>
            </div>

            {trendingCreators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                    {trendingCreators.map((c: any) => (
                        <div key={c.userId || c.id} style={{ transform: 'scale(1.1)', marginTop: '8px' }}>
                            <CreatorCard creator={{ ...c, isTrending: true }} />
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ color: T.inkFaint, fontFamily: 'Georgia,serif', textAlign: 'center', marginTop: '40px' }}>No trending creators at the moment.</p>
            )}
        </div>
    )
}
