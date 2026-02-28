'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Interest {
    interestId: string;
    level: number | null;
    interest: { name: string; parentId: string | null };
}

interface Post {
    id: string;
    interestId: string;
    caption: string | null;
    interest: { id: string; name: string };
    media: { id: string; url: string; type: string } | null;
}

interface FeedCandidate {
    id: string;
    displayName: string;
    revealed: boolean;
    distanceKm: number;
    lastActiveAt?: string | null;
    score: number;
    interests: Interest[];
    posts: Post[];
    _exactMatches: number;
    _parentChildMatches: number;
    _momentumBoost: number;
    _activityFactor: number;
    _interestScore: number;
    _distanceFactor: number;
    _finalScore: number;
}

// ─── Feed Card ───────────────────────────────────────────────────────────────

function FeedCard({
    user,
    jwt,
    onLike,
    onPass,
}: {
    user: FeedCandidate;
    jwt: string;
    onLike: (id: string) => void;
    onPass: (id: string) => void;
}) {
    const [acting, setActing] = useState<'like' | 'pass' | null>(null);
    const [done, setDone] = useState<'like' | 'pass' | null>(null);
    const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);

    const handleAction = useCallback(async (type: 'LIKE' | 'PASS') => {
        const key = type === 'LIKE' ? 'like' : 'pass';
        if (acting || swiping) return;
        setActing(key);
        setSwiping(type === 'LIKE' ? 'right' : 'left');

        // Optimistically hide card after short swipe anim
        setTimeout(() => {
            setDone(key);
            if (type === 'LIKE') onLike(user.id);
            else onPass(user.id);
        }, 300);
        try {
            const res = await fetch('/api/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ targetId: user.id, action: type }),
            });
            const data = await res.json();
            if (data.match) {
                // Emit match event (handled by parent)
                window.dispatchEvent(new CustomEvent('tribe:match', { detail: { name: user.displayName } }));
            }
        } catch {
            setActing(null);
            setSwiping(null);
        }
    }, [user.id, jwt, onLike, onPass, acting, swiping]);

    const compatPercent = Math.round(user.score);
    const isRevealed = user.revealed;
    const isRecentlyActive = user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime() < 6 * 3600 * 1000);

    const compatColor = compatPercent >= 70
        ? 'var(--green)'
        : compatPercent >= 45
            ? 'var(--gold)'
            : 'var(--text-secondary)';

    if (done) {
        return null;
    }

    // Dynamic swipe transform mapped to Like/Pass intention
    const transformStyle = swiping === 'right'
        ? 'translateX(100vw) rotate(10deg)'
        : swiping === 'left'
            ? 'translateX(-100vw) rotate(-10deg)'
            : 'translateX(0)';

    return (
        <div style={{
            border: `1px solid ${isRevealed ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            background: isRevealed ? 'var(--bg-card-revealed)' : 'var(--bg-card)',
            boxShadow: isRevealed
                ? '0 0 0 1px rgba(74,222,128,0.1), var(--shadow-card)'
                : 'var(--shadow-card)',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'default',
            transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease-out, box-shadow 0.2s ease, border-color 0.2s ease',
            transform: transformStyle,
            opacity: swiping ? 0 : 1,
        }}
            onMouseEnter={(e) => {
                if (!swiping && !isRevealed) {
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }
            }}
            onMouseLeave={(e) => {
                if (!swiping && !isRevealed) {
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                }
            }}>

            {/* Reveal Strip */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '2px',
                background: isRevealed
                    ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
                    : 'linear-gradient(90deg, #333, #222)',
            }} />

            <div style={{ padding: '20px 22px 0' }}>

                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            {/* Lock badge */}
                            <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                background: isRevealed ? 'var(--green-soft)' : 'rgba(255,255,255,0.05)',
                                color: isRevealed ? 'var(--green)' : 'var(--text-muted)',
                                border: `1px solid ${isRevealed ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
                                fontWeight: 500,
                                letterSpacing: '0.02em',
                            }}>
                                {isRevealed ? '🔓 Matched' : '🔒 Locked'}
                            </span>

                            {user._momentumBoost > 0 && (
                                <span style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '20px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: 'var(--gold)',
                                    border: '1px solid rgba(245,158,11,0.25)',
                                    fontWeight: 500,
                                }}>
                                    ⚡ Active
                                </span>
                            )}
                        </div>

                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.2,
                        }}>
                            {isRevealed ? user.displayName : (
                                <>
                                    {user.displayName}
                                    <span style={{ filter: 'blur(6px)', userSelect: 'none', marginLeft: '4px', opacity: 0.5 }}>
                                        &nbsp;████
                                    </span>
                                </>
                            )}
                        </h2>

                        <div style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            marginTop: '3px',
                        }}>
                            {isRevealed
                                ? `${user.distanceKm.toFixed(1)} km away`
                                : `~${user.distanceKm} km away`}
                        </div>
                    </div>

                    {/* Compatibility Score */}
                    <div style={{
                        textAlign: 'center',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                        minWidth: '68px',
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: compatColor, lineHeight: 1 }}>
                            {compatPercent}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            MATCH
                        </div>
                    </div>
                </div>

                {/* Interests */}
                {user.interests && user.interests.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                            Interests
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {user.interests.slice(0, 6).map((ui: Interest, i: number) => (
                                <span key={i} style={{
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    background: i < user._exactMatches
                                        ? 'var(--accent-soft)'
                                        : 'rgba(255,255,255,0.04)',
                                    color: i < user._exactMatches
                                        ? 'var(--accent)'
                                        : 'var(--text-secondary)',
                                    border: `1px solid ${i < user._exactMatches ? 'rgba(124,106,247,0.3)' : 'var(--border)'}`,
                                    fontWeight: i < user._exactMatches ? 500 : 400,
                                }}>
                                    {ui.interest.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts Preview */}
                {user.posts && user.posts.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                            Recent Posts
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {user.posts.slice(0, 3).map((post: Post, i: number) => (
                                <div key={i} style={{
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                }}>
                                    <span style={{
                                        fontSize: '11px',
                                        padding: '2px 7px',
                                        borderRadius: '12px',
                                        background: 'var(--accent-soft)',
                                        color: 'var(--accent)',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                        fontWeight: 500,
                                    }}>
                                        {post.interest?.name ?? 'Post'}
                                    </span>
                                    {post.caption && (
                                        <span style={{
                                            fontSize: '12px',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.4,
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}>
                                            "{post.caption}"
                                        </span>
                                    )}
                                    {!post.caption && post.media && (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            [{post.media.type === 'video' ? '🎥' : '🖼️'} Media]
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{
                padding: '14px 22px 18px',
                display: 'flex',
                gap: '10px',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '4px',
            }}>
                <button
                    onClick={() => handleAction('PASS')}
                    disabled={!!acting}
                    style={{
                        flex: 1,
                        padding: '11px 0',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(248,113,113,0.07)',
                        color: acting ? 'var(--text-muted)' : 'var(--red)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'var(--transition)',
                        cursor: acting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!acting) (e.target as HTMLElement).style.background = 'rgba(248,113,113,0.14)'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(248,113,113,0.07)'; }}
                >
                    Pass
                </button>
                <button
                    onClick={() => handleAction('LIKE')}
                    disabled={!!acting}
                    style={{
                        flex: 2,
                        padding: '11px 0',
                        borderRadius: 'var(--radius-sm)',
                        background: acting === 'like'
                            ? 'rgba(124,106,247,0.25)'
                            : 'var(--accent-soft)',
                        color: acting ? 'var(--text-muted)' : 'var(--accent)',
                        border: '1px solid rgba(124,106,247,0.3)',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'var(--transition)',
                        cursor: acting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!acting) (e.target as HTMLElement).style.background = 'rgba(124,106,247,0.2)'; }}
                    onMouseLeave={e => { if (!acting) (e.target as HTMLElement).style.background = 'var(--accent-soft)'; }}
                >
                    {acting === 'like' ? '✓ Liked' : 'Like'}
                </button>
            </div>
        </div>
    );
}

// ─── Match Modal ─────────────────────────────────────────────────────────────

function MatchModal({ name, onClose }: { name: string; onClose: () => void }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '24px',
                padding: '48px 40px',
                textAlign: 'center',
                maxWidth: '360px',
                boxShadow: '0 0 60px rgba(74,222,128,0.15)',
                animation: 'none',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <div style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                }}>
                    It's a Match!
                </div>
                <div style={{
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    marginBottom: '28px',
                    lineHeight: 1.5,
                }}>
                    You and <strong style={{ color: 'var(--green)' }}>{name}</strong> both liked each other.
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '12px 32px',
                        borderRadius: '12px',
                        background: 'var(--green-soft)',
                        color: 'var(--green)',
                        border: '1px solid rgba(74,222,128,0.3)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Keep Discovering
                </button>
            </div>
        </div>
    );
}

// ─── Main Feed Page ───────────────────────────────────────────────────────────

export default function FeedPage() {
    const [jwt, setJwt] = useState('');
    const [feed, setFeed] = useState<FeedCandidate[]>([]);
    const [nextCursor, setNextCursor] = useState<{ score: number, id: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [matchName, setMatchName] = useState<string | null>(null);
    const router = useRouter();

    // Sync auth token strictly from persistent layer
    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (stored) {
            setJwt(stored);
        } else {
            setError('Unauthorized. Please log in.');
        }
    }, []);

    // Listen for match events from FeedCards
    useState(() => {
        const handler = (e: Event) => setMatchName((e as CustomEvent).detail.name);
        window.addEventListener('tribe:match', handler);
        return () => window.removeEventListener('tribe:match', handler);
    });

    const fetchFeed = useCallback(async (reset: boolean = true) => {
        if (!jwt.trim()) return;

        if (reset) {
            setLoading(true);
            setFeed([]);
            setNextCursor(null);
        } else {
            setLoadingMore(true);
        }

        setError('');

        try {
            let url = '/api/feed';
            if (!reset && nextCursor) {
                url += `?cursorScore=${nextCursor.score}&cursorId=${nextCursor.id}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${jwt.trim()}` },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Feed fetch failed');

            if (reset) {
                setFeed(data.feed || []);
            } else {
                setFeed(prev => [...prev, ...(data.feed || [])]);
            }

            // Onboarding Native Hand-off
            if (data.needsInterests) {
                router.push('/onboarding');
            }

            setNextCursor(data.nextCursor || null);

        } catch (e: any) {
            setError(e.message);
        } finally {
            if (reset) setLoading(false);
            else setLoadingMore(false);
        }
    }, [jwt, nextCursor]);

    const removeCard = useCallback((id: string) => {
        setTimeout(() => {
            setFeed(f => f.filter(u => u.id !== id));
        }, 600);
    }, []);

    useEffect(() => {
        if (jwt) {
            fetchFeed(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jwt]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
        }}>

            {/* Match Modal */}
            {matchName && (
                <MatchModal name={matchName} onClose={() => setMatchName(null)} />
            )}

            {/* Top Nav */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid var(--border)',
                background: 'rgba(12,12,14,0.9)',
                backdropFilter: 'blur(16px)',
                padding: '0 24px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '28px', height: '28px',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700, color: '#fff',
                    }}>
                        T
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.02em' }}>
                        Tribe
                    </span>
                </div>

                <nav style={{ display: 'flex', gap: '4px' }}>
                    {['Feed', 'Matches', 'Profile'].map((item, i) => (
                        <a key={item} href={`/${item.toLowerCase()}`} style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: i === 0 ? 'var(--accent)' : 'var(--text-secondary)',
                            background: i === 0 ? 'var(--accent-soft)' : 'transparent',
                            transition: 'var(--transition)',
                        }}>
                            {item}
                        </a>
                    ))}
                </nav>
            </header>

            {/* Main Content */}
            <main style={{
                flex: 1,
                maxWidth: '640px',
                width: '100%',
                margin: '0 auto',
                padding: '32px 20px 80px',
            }}>

                {/* Section header */}
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{
                        fontSize: '26px',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                    }}>
                        Discover
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Ranked by compatibility — shared interests, recency, and proximity
                    </p>
                </div>



                {error && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--red-soft)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        color: 'var(--red)',
                        fontSize: '13px',
                        marginBottom: '20px',
                    }}>
                        {error}
                    </div>
                )}

                {/* Feed stats */}
                {feed.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        marginBottom: '20px',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                    }}>
                        <div>
                            <span style={{ color: 'var(--text-muted)' }}>Candidates</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: '6px' }}>{feed.length}</span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)' }}>Revealed</span>
                            <span style={{ color: 'var(--green)', fontWeight: 600, marginLeft: '6px' }}>{feed.filter(u => u.revealed).length}</span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)' }}>Avg. Match</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: '6px' }}>
                                {Math.round(feed.reduce((a, u) => a + u.score, 0) / feed.length)}%
                            </span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)' }}>Active Now</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 600, marginLeft: '6px' }}>
                                {feed.filter(u => u._momentumBoost > 0).length}
                            </span>
                        </div>
                    </div>
                )}

                {/* Feed Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {feed.map(user => (
                        <FeedCard
                            key={user.id}
                            user={user}
                            jwt={jwt}
                            onLike={removeCard}
                            onPass={removeCard}
                        />
                    ))}

                    {loading && (
                        <>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{
                                    height: '240px',
                                    borderRadius: 'var(--radius)',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                }} />
                            ))}
                        </>
                    )}
                </div>

                {nextCursor && !loading && feed.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <button
                            onClick={() => fetchFeed(false)}
                            disabled={loadingMore}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '24px',
                                background: loadingMore ? 'transparent' : 'var(--bg-card)',
                                border: `1px solid ${loadingMore ? 'transparent' : 'var(--border)'}`,
                                color: loadingMore ? 'var(--text-muted)' : 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loadingMore ? 'default' : 'pointer',
                                transition: 'var(--transition)'
                            }}
                            onMouseEnter={e => { if (!loadingMore) (e.target as HTMLElement).style.borderColor = 'var(--text-muted)' }}
                            onMouseLeave={e => { if (!loadingMore) (e.target as HTMLElement).style.borderColor = 'var(--border)' }}
                        >
                            {loadingMore ? 'Loading more candidates...' : 'Load more'}
                        </button>
                    </div>
                )}

                {!loading && feed.length === 0 && jwt && !error && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌀</div>
                        <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                            Feed empty
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            Everyone nearby has been seen. Check back soon.
                        </div>
                    </div>
                )}

                {!jwt && !loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔑</div>
                        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                            Paste a JWT to begin
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            Hit <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent)' }}>/api/seed</code> to generate a test token
                        </div>
                    </div>
                )}
            </main>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 12px var(--green); }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
}
