'use client';

import { useState, useCallback, useEffect } from 'react';

// Using types defined from API
interface MatchPayload {
    matchId: string;
    matchedAt: string;
    id: string;
    name: string;
    distanceKm: number | null;
    lastActiveAt: string | null;
    sharedInterests: string[];
    latestPost: {
        interest: { name: string };
        media: { type: string } | null;
    } | null;
}

function timeSince(dateString: string | null) {
    if (!dateString) return 'unknown';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    return 'Just now';
}

function MatchCard({ match }: { match: MatchPayload }) {
    const isOnline = match.lastActiveAt && (Date.now() - new Date(match.lastActiveAt).getTime() < 3600000); // 1 hour

    return (
        <div style={{
            border: '1px solid rgba(124,106,247,0.2)',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            transition: 'var(--transition)',
            position: 'relative',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {match.name}
                        {isOnline && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
                        )}
                    </h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {match.distanceKm !== null ? `${match.distanceKm.toFixed(1)} km away` : 'Unknown location'}
                    </div>
                </div>
                <div style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textAlign: 'right'
                }}>
                    <div>Active {timeSince(match.lastActiveAt)}</div>
                    <div style={{ color: 'var(--accent)', marginTop: '2px' }}>Matched {timeSince(match.matchedAt)}</div>
                </div>
            </div>

            {/* Shared Interests */}
            {match.sharedInterests.length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                        Shared Interests
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {match.sharedInterests.map((interest, i) => (
                            <span key={i} style={{
                                fontSize: '12px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: 'var(--accent-soft)',
                                color: 'var(--accent)',
                                border: '1px solid rgba(124,106,247,0.3)',
                                fontWeight: 500,
                            }}>
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Latest Post Bubble */}
            {match.latestPost && (
                <div style={{
                    marginTop: '6px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Latest {match.latestPost.interest.name} post:</span>
                    {" "} {match.latestPost.media ? `Contains ${match.latestPost.media.type}` : 'Posted recently'}
                </div>
            )}

            {/* Action */}
            <a href={`/profile/${match.id}`} style={{
                marginTop: '8px',
                padding: '12px 0',
                width: '100%',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)',
                textAlign: 'center',
                display: 'block',
                textDecoration: 'none'
            }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--border-subtle)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--bg)' }}>
                Open Profile
            </a>

        </div>
    );
}


export default function MatchesPage() {
    const [jwt, setJwt] = useState('');
    const [matches, setMatches] = useState<MatchPayload[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchMatches = useCallback(async () => {
        if (!jwt.trim()) {
            setError('Paste a JWT token first');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/matches', {
                headers: { Authorization: `Bearer ${jwt.trim()}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Matches fetch failed');
            setMatches(data.matches || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [jwt]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Top Nav (Reused component ideal later, direct for now) */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                borderBottom: '1px solid var(--border)', background: 'rgba(12,12,14,0.9)',
                backdropFilter: 'blur(16px)', padding: '0 24px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'var(--accent)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff',
                    }}>T</div>
                    <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.02em' }}>Tribe</span>
                </div>
                <nav style={{ display: 'flex', gap: '4px' }}>
                    {['Feed', 'Matches', 'Profile'].map((item, i) => (
                        <a key={item} href={`/${item.toLowerCase()}`} style={{
                            padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                            color: i === 1 ? 'var(--accent)' : 'var(--text-secondary)',
                            background: i === 1 ? 'var(--accent-soft)' : 'transparent',
                            transition: 'var(--transition)',
                        }}>
                            {item}
                        </a>
                    ))}
                </nav>
            </header>

            <main style={{ flex: 1, maxWidth: '640px', width: '100%', margin: '0 auto', padding: '32px 20px 80px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Your Matches
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        People who mutually align with your discovery network.
                    </p>
                </div>

                {/* JWT Input Temporary block */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
                    <input
                        value={jwt} onChange={e => setJwt(e.target.value)}
                        placeholder="Paste JWT token to load your locker"
                        onKeyDown={e => e.key === 'Enter' && fetchMatches()}
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                        }}
                    />
                    <button
                        onClick={fetchMatches} disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                            background: loading ? 'rgba(124,106,247,0.2)' : 'var(--accent)',
                            color: '#fff', fontSize: '13px', fontWeight: 600
                        }}
                    >
                        {loading ? '...' : 'Unlock'}
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px', marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                {/* Matches View */}
                {!loading && matches.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {matches.map(m => <MatchCard key={m.matchId} match={m} />)}
                    </div>
                )}

                {!loading && matches.length === 0 && jwt && !error && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔓</div>
                        <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                            No Mutual Unlocks
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            Keep browsing the feed to interact and discover active profiles.
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
