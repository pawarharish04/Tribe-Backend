'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '../../../../design/tokens';
import CreatorCard from '../../../../components/feed/CreatorCard';

export default function CreatorsDiscoveryPage() {
    const [jwt, setJwt] = useState('');
    const [creators, setCreators] = useState<any[]>([]);
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

        // Fetch recommended creators (Compatibility Engine)
        fetch('/api/recommend-creators', {
            headers: { 'Authorization': `Bearer ${jwt}` }
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setCreators(data || []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [jwt]);

    return (
        <div style={{ minHeight: '100vh', background: T.cream, padding: '40px 20px 80px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', borderBottom: `1px solid ${T.sep}`, paddingBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.ink, letterSpacing: '-0.03em', marginBottom: '6px' }}>Network</h1>
                <p style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, lineHeight: 1.6 }}>
                    Creators mapped to you through shared interests and aesthetic output.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: T.inkFaint, fontFamily: 'Georgia,serif', marginTop: '40px' }}>Mapping network...</div>
            ) : creators.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '24px',
                    justifyItems: 'center'
                }}>
                    {creators.map((c: any) => (
                        <div key={c.userId || c.id} style={{ transform: 'scale(1.1)', marginTop: '8px' }}>
                            <CreatorCard creator={c} />
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ color: T.inkFaint, fontFamily: 'Georgia,serif', textAlign: 'center', marginTop: '40px' }}>No direct matches isolated yet.</p>
            )}
        </div>
    )
}
