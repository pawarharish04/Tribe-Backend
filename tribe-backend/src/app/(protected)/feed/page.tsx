'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '../../../design/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

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
    distanceKm: number | null;
    distanceHidden?: boolean;
    lastActiveAt?: string | null;
    score: number;
    interests: Interest[];
    posts: Post[];
    _exactMatches: number;
    _parentChildMatches: number;
    _momentumBoost?: number;
    _activityFactor?: number;
    _interestScore: number;
    _distanceFactor: number;
    _finalScore: number;
}

interface RecommendedCreator {
    userId: string;
    name: string;
    avatarUrl: string | null;
    compatibilityScore: number;
    sharedInterests: string[];
}

// ─── Post Like Row ────────────────────────────────────────────────────────────

function PostLikeRow({ post, jwt }: { post: Post; jwt: string }) {
    const [liked, setLiked] = useState(false);
    const [pending, setPending] = useState(false);

    const handleLike = async () => {
        if (pending || !post.id) return;
        setLiked(prev => !prev);
        setPending(true);
        try {
            const res = await fetch('/api/post-like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ postId: post.id }),
            });
            if (!res.ok) setLiked(prev => !prev);
        } catch {
            setLiked(prev => !prev);
        } finally {
            setPending(false);
        }
    };

    return (
        <div style={{
            padding: '9px 12px',
            borderRadius: '8px',
            background: T.parchment,
            border: `1px solid ${T.sep}`,
            display: 'flex', alignItems: 'center', gap: '10px',
        }}>
            <span style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '12px',
                background: T.sageSoft, color: T.sage, border: `1px solid ${T.sage}40`,
                whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'Georgia,serif',
                letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{post.interest?.name ?? 'Post'}</span>
            <span style={{
                fontSize: '12px', color: T.inkMid, lineHeight: 1.4,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1,
                fontFamily: "'Cormorant Garamond',Georgia,serif",
            }}>
                {post.caption ? `"${post.caption}"` : post.media ? `[${post.media.type === 'video' ? '🎥' : '🖼️'} Media]` : null}
            </span>
            <button onClick={handleLike} disabled={pending} title={liked ? 'Unlike' : 'Like'} style={{
                background: 'none', border: 'none',
                cursor: pending ? 'not-allowed' : 'pointer',
                fontSize: '16px', lineHeight: 1, padding: '2px 4px',
                color: liked ? T.clay : T.inkFaint,
                transition: 'color 0.15s, transform 0.12s',
                transform: liked ? 'scale(1.15)' : 'scale(1)',
                flexShrink: 0, opacity: pending ? 0.6 : 1,
            }}
                onMouseEnter={e => { if (!liked) (e.currentTarget as HTMLElement).style.color = T.clay; }}
                onMouseLeave={e => { if (!liked) (e.currentTarget as HTMLElement).style.color = T.inkFaint; }}
            >{liked ? '♥' : '♡'}</button>
        </div>
    );
}

// ─── Feed Card ────────────────────────────────────────────────────────────────

function FeedCard({ user, jwt, onLike, onPass }: { user: FeedCandidate; jwt: string; onLike: (id: string) => void; onPass: (id: string) => void }) {
    const [acting, setActing] = useState<'like' | 'pass' | null>(null);
    const [done, setDone] = useState<'like' | 'pass' | null>(null);
    const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);

    const handleAction = useCallback(async (type: 'LIKE' | 'PASS') => {
        const key = type === 'LIKE' ? 'like' : 'pass';
        if (acting || swiping) return;
        setActing(key);
        setSwiping(type === 'LIKE' ? 'right' : 'left');
        setTimeout(() => { setDone(key); if (type === 'LIKE') onLike(user.id); else onPass(user.id); }, 300);
        try {
            const res = await fetch('/api/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ targetId: user.id, type }),
            });
            const data = await res.json();
            if (data.matched) window.dispatchEvent(new CustomEvent('tribe:match', { detail: { name: user.displayName } }));
        } catch {
            setActing(null); setSwiping(null);
        }
    }, [user.id, jwt, onLike, onPass, acting, swiping]);

    const compatPercent = Math.round(user.score);
    const isRevealed = user.revealed;
    const isRecentlyActive = user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime() < 6 * 3600 * 1000);
    const compatColor = compatPercent >= 70 ? T.sage : compatPercent >= 45 ? T.gold : T.inkLight;

    if (done) return null;

    const transformStyle = swiping === 'right' ? 'translateX(100vw) rotate(8deg)' : swiping === 'left' ? 'translateX(-100vw) rotate(-8deg)' : 'translateX(0)';

    return (
        <div style={{
            border: `1px solid ${isRevealed ? T.sage + '50' : T.sep}`,
            borderRadius: '16px',
            background: isRevealed ? T.sageSoft : '#FFFFFF',
            boxShadow: isRevealed ? `0 0 0 1px ${T.sage}20, 0 4px 20px rgba(28,25,23,0.06)` : '0 2px 12px rgba(28,25,23,0.05)',
            overflow: 'hidden', position: 'relative', cursor: 'default',
            transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1), opacity 0.3s ease-out, box-shadow 0.2s',
            transform: transformStyle, opacity: swiping ? 0 : 1,
        }}
            onMouseEnter={e => { if (!swiping) e.currentTarget.style.boxShadow = '0 8px 28px rgba(28,25,23,0.10)'; }}
            onMouseLeave={e => { if (!swiping) e.currentTarget.style.boxShadow = '0 2px 12px rgba(28,25,23,0.05)'; }}
        >
            {/* Top accent rule */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: isRevealed ? `linear-gradient(90deg,${T.sage},${T.gold})` : `linear-gradient(90deg,${T.sep},${T.parchment})` }} />

            <div style={{ padding: '20px 22px 0' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <span style={{
                                fontSize: '10px', padding: '2px 9px', borderRadius: '20px',
                                background: isRevealed ? T.sageSoft : T.parchment,
                                color: isRevealed ? T.sage : T.inkFaint,
                                border: `1px solid ${isRevealed ? T.sage + '40' : T.sep}`,
                                fontFamily: 'Georgia,serif', letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}>{isRevealed ? '◉ Matched' : '◎ Locked'}</span>
                            {(user._momentumBoost ?? 0) > 0 && (
                                <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '20px', background: T.goldSoft, color: T.gold, border: `1px solid ${T.gold}40`, fontFamily: 'Georgia,serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>◈ Active</span>
                            )}
                        </div>
                        <h2 style={{ fontSize: '20px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            {isRevealed ? user.displayName : (
                                <>{user.displayName}<span style={{ filter: 'blur(5px)', userSelect: 'none', marginLeft: '4px', opacity: 0.3 }}>&nbsp;████</span></>
                            )}
                        </h2>
                        <div style={{ fontSize: '12px', color: T.inkLight, marginTop: '3px', fontFamily: 'Georgia,serif' }}>
                            {user.distanceHidden ? 'Distance hidden' : isRevealed ? `${user.distanceKm?.toFixed(1) ?? '??'} km away` : `~${user.distanceKm ?? '??'} km away`}
                        </div>
                    </div>

                    {/* Compat score — editorial large numeral */}
                    <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: '10px', background: T.parchment, border: `1px solid ${T.sep}`, minWidth: '64px' }}>
                        <div style={{ fontSize: '22px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, color: compatColor, lineHeight: 1 }}>{compatPercent}</div>
                        <div style={{ fontSize: '8px', color: T.inkFaint, marginTop: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia,serif' }}>MATCH</div>
                    </div>
                </div>

                {/* Interests */}
                {user.interests?.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.inkFaint, marginBottom: '8px', fontFamily: 'Georgia,serif' }}>Interests</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {user.interests.slice(0, 6).map((ui: Interest, i: number) => (
                                <span key={i} style={{
                                    fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                                    background: i < user._exactMatches ? T.sageSoft : T.parchment,
                                    color: i < user._exactMatches ? T.sage : T.inkMid,
                                    border: `1px solid ${i < user._exactMatches ? T.sage + '40' : T.sep}`,
                                    fontFamily: "'Cormorant Garamond',Georgia,serif",
                                }}>{ui.interest.name}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts */}
                {user.posts?.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.inkFaint, marginBottom: '8px', fontFamily: 'Georgia,serif' }}>Recent Works</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {user.posts.slice(0, 3).map((post: Post, i: number) => (
                                <PostLikeRow key={post.id ?? i} post={post} jwt={jwt} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ padding: '14px 22px 18px', display: 'flex', gap: '10px', borderTop: `1px solid ${T.sep}`, marginTop: '4px' }}>
                <button onClick={() => handleAction('PASS')} disabled={!!acting} style={{
                    flex: 1, padding: '10px 0', borderRadius: '8px',
                    background: T.claySoft, color: acting ? T.inkFaint : T.clay,
                    border: `1px solid ${T.clay}35`,
                    fontSize: '13px', fontFamily: 'Georgia,serif', letterSpacing: '0.04em',
                    transition: 'all 0.18s', cursor: acting ? 'not-allowed' : 'pointer',
                }}
                    onMouseEnter={e => { if (!acting) (e.target as HTMLElement).style.background = `${T.clay}20`; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = T.claySoft; }}
                >Pass</button>
                <button onClick={() => handleAction('LIKE')} disabled={!!acting} style={{
                    flex: 2, padding: '10px 0', borderRadius: '8px',
                    background: acting === 'like' ? `${T.sage}25` : T.sageSoft,
                    color: acting ? T.inkFaint : T.sage,
                    border: `1px solid ${T.sage}40`,
                    fontSize: '13px', fontWeight: 600, fontFamily: 'Georgia,serif', letterSpacing: '0.04em',
                    transition: 'all 0.18s', cursor: acting ? 'not-allowed' : 'pointer',
                }}
                    onMouseEnter={e => { if (!acting) (e.target as HTMLElement).style.background = `${T.sage}20`; }}
                    onMouseLeave={e => { if (!acting) (e.target as HTMLElement).style.background = T.sageSoft; }}
                >{acting === 'like' ? '✓ Liked' : 'Like'}</button>
            </div>
        </div>
    );
}

// ─── Match Modal ──────────────────────────────────────────────────────────────

function MatchModal({ name, onClose }: { name: string; onClose: () => void }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ background: T.cream, border: `1px solid ${T.sage}45`, borderRadius: '24px', padding: '48px 40px', textAlign: 'center', maxWidth: '360px', boxShadow: `0 48px 96px rgba(28,25,23,0.18), 0 0 60px ${T.sage}15`, animation: 'sUp 0.32s cubic-bezier(0.34,1.5,0.64,1)' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>◉</div>
                <div style={{ fontSize: '24px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.ink, marginBottom: '8px', letterSpacing: '-0.03em' }}>A Connection</div>
                <div style={{ fontSize: '15px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkMid, marginBottom: '28px', lineHeight: 1.6, fontStyle: 'italic' }}>
                    You and <strong style={{ color: T.sage }}>{name}</strong> recognized something in each other.
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => window.location.href = '/matches'} style={{ padding: '10px 22px', borderRadius: '8px', background: T.ink, color: T.cream, border: 'none', fontSize: '13px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>View Match</button>
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: '8px', background: T.sageSoft, color: T.sage, border: `1px solid ${T.sage}40`, fontSize: '13px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Keep Discovering</button>
                </div>
            </div>
        </div>
    );
}

// ─── Feed Page ────────────────────────────────────────────────────────────────

export default function FeedPage() {
    const [jwt, setJwt] = useState('');
    const [feed, setFeed] = useState<FeedCandidate[]>(() => {
        if (typeof window !== 'undefined') {
            const c = sessionStorage.getItem('tribe_feed_cache');
            return c ? JSON.parse(c) : [];
        }
        return [];
    });
    const [nextCursor, setNextCursor] = useState<{ score: number; id: string } | null>(() => {
        if (typeof window !== 'undefined') {
            const c = sessionStorage.getItem('tribe_cursor_cache');
            return c ? JSON.parse(c) : null;
        }
        return null;
    });
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [matchName, setMatchName] = useState<string | null>(null);
    const [recommendedCreators, setRecommendedCreators] = useState<RecommendedCreator[]>([]);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (stored) setJwt(stored);
        else setError('Unauthorized. Please log in.');
    }, []);

    useState(() => {
        const handler = (e: Event) => setMatchName((e as CustomEvent).detail.name);
        window.addEventListener('tribe:match', handler);
        return () => window.removeEventListener('tribe:match', handler);
    });

    const fetchFeed = useCallback(async (reset: boolean = true) => {
        if (!jwt.trim()) return;
        if (reset) { setLoading(true); setFeed([]); setNextCursor(null); }
        else setLoadingMore(true);
        setError('');
        try {
            let url = '/api/feed';
            if (!reset && nextCursor) url += `?cursorScore=${nextCursor.score}&cursorId=${nextCursor.id}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt.trim()}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Feed fetch failed');
            if (reset) setFeed(data.feed || []);
            else setFeed(prev => [...prev, ...(data.feed || [])]);
            if (data.needsInterests) router.push('/onboarding');
            setNextCursor(data.nextCursor || null);

            // Also explicitly fetch recommended creators independently if reset
            if (reset) {
                fetch('/api/recommend-creators', { headers: { Authorization: `Bearer ${jwt.trim()}` } })
                    .then(r => r.ok ? r.json() : [])
                    .then(creators => setRecommendedCreators(creators))
                    .catch(() => { }); // silent failure for recommendations
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            if (reset) setLoading(false); else setLoadingMore(false);
        }
    }, [jwt, nextCursor, router]);

    const removeCard = useCallback((id: string) => { setTimeout(() => setFeed(f => f.filter(u => u.id !== id)), 600); }, []);

    useEffect(() => { if (feed.length > 0) sessionStorage.setItem('tribe_feed_cache', JSON.stringify(feed)); }, [feed]);
    useEffect(() => { if (nextCursor) sessionStorage.setItem('tribe_cursor_cache', JSON.stringify(nextCursor)); else sessionStorage.removeItem('tribe_cursor_cache'); }, [nextCursor]);
    useEffect(() => { if (jwt && feed.length === 0) fetchFeed(true); }, [jwt]);

    return (
        <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', flexDirection: 'column' }}>
            {matchName && <MatchModal name={matchName} onClose={() => setMatchName(null)} />}

            <main style={{ flex: 1, maxWidth: '640px', width: '100%', margin: '0 auto', padding: '40px 20px 80px' }}>
                {/* Page header */}
                <div style={{ marginBottom: '32px', borderBottom: `1px solid ${T.sep}`, paddingBottom: '24px' }}>
                    <h1 style={{ fontSize: '32px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.ink, letterSpacing: '-0.03em', marginBottom: '6px' }}>Discover</h1>
                    <p style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, lineHeight: 1.6 }}>
                        Ranked by compatibility — shared interests, recency, and proximity
                    </p>
                </div>

                {/* Creators Similar to You (Horizontal Recommendations) */}
                {recommendedCreators.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.inkFaint, fontWeight: 600, fontFamily: 'Georgia,serif' }}>
                                Creators Similar to You
                            </div>
                        </div>
                        <div style={{
                            display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px',
                            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -20px', padding: '0 20px 16px'
                        }}>
                            {/* Hide scrollbar trick */}
                            <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                            {recommendedCreators.map(creator => (
                                <div key={creator.userId}
                                    onClick={() => router.push(`/profile/${creator.userId}`)}
                                    style={{
                                        flexShrink: 0, width: '160px', borderRadius: '16px', background: T.parchment,
                                        border: `1px solid ${T.sep}`, padding: '16px', cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(28,25,23,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: T.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 12px', fontSize: '18px', fontWeight: 600, border: `1px solid ${T.sep}` }}>
                                        {creator.avatarUrl ? <img src={creator.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : creator.name.charAt(0)}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink, marginBottom: '2px', fontFamily: "'Fraunces',Georgia,serif", textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        {creator.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: T.inkLight, fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', marginBottom: '12px' }}>
                                        {Math.round(creator.compatibilityScore)}% Match
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {creator.sharedInterests.slice(0, 2).map((interest, i) => (
                                            <span key={i} style={{ fontSize: '9px', padding: '2px 6px', background: T.sageSoft, color: T.sage, borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                {interest}
                                            </span>
                                        ))}
                                        {creator.sharedInterests.length > 2 && (
                                            <span style={{ fontSize: '9px', padding: '2px 6px', background: 'transparent', color: T.inkFaint }}>+{creator.sharedInterests.length - 2}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '12px 16px', borderRadius: '8px', background: T.claySoft, border: `1px solid ${T.clay}35`, color: T.clay, fontSize: '13px', marginBottom: '20px', fontFamily: 'Georgia,serif' }}>{error}</div>
                )}

                {/* Stats row */}
                {feed.length > 0 && (
                    <div style={{ display: 'flex', gap: '0', marginBottom: '24px', background: 'white', border: `1px solid ${T.sep}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(28,25,23,0.06)' }}>
                        {[
                            { l: 'Candidates', v: feed.length, c: T.ink },
                            { l: 'Matched', v: feed.filter(u => u.revealed).length, c: T.sage },
                            { l: 'Avg Match', v: Math.round(feed.reduce((a, u) => a + u.score, 0) / feed.length) + '%', c: T.clay },
                            { l: 'Active', v: feed.filter(u => (u._momentumBoost ?? 0) > 0).length, c: T.gold },
                        ].map((s, i) => (
                            <div key={i} style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRight: i < 3 ? `1px solid ${T.sep}` : 'none' }}>
                                <div style={{ fontSize: '18px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, color: s.c, lineHeight: 1 }}>{s.v}</div>
                                <div style={{ fontSize: '9px', color: T.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia,serif', marginTop: '2px' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {feed.map(user => (
                        <FeedCard key={user.id} user={user} jwt={jwt} onLike={removeCard} onPass={removeCard} />
                    ))}
                    {loading && [1, 2, 3].map(i => (
                        <div key={i} style={{ height: '220px', borderRadius: '16px', background: T.parchment, border: `1px solid ${T.sep}`, animation: 'pulse 1.5s ease infinite' }} />
                    ))}
                </div>

                {nextCursor && !loading && feed.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '28px' }}>
                        <button onClick={() => fetchFeed(false)} disabled={loadingMore} style={{
                            padding: '10px 28px', borderRadius: '24px',
                            background: 'white', border: `1.5px solid ${T.sep}`,
                            color: T.inkMid, fontSize: '13px', fontFamily: 'Georgia,serif',
                            cursor: loadingMore ? 'default' : 'pointer', transition: 'all 0.18s',
                        }}
                            onMouseEnter={e => { if (!loadingMore) (e.target as HTMLElement).style.borderColor = T.ink; }}
                            onMouseLeave={e => { if (!loadingMore) (e.target as HTMLElement).style.borderColor = T.sep; }}
                        >{loadingMore ? 'Loading…' : 'Load more'}</button>
                    </div>
                )}

                {!loading && feed.length === 0 && jwt && !error && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: T.inkFaint }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.4 }}>◎</div>
                        <div style={{ fontSize: '16px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', color: T.inkLight, marginBottom: '8px' }}>Feed empty</div>
                        <div style={{ fontSize: '13px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkFaint }}>Everyone nearby has been seen. Check back soon.</div>
                    </div>
                )}
            </main>
        </div>
    );
}
