'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CompatibilityBadge from '../../../components/ui/CompatibilityBadge';
import InterestTag from '../../../components/ui/InterestTag';

interface InterestDetail {
    interestId: string;
    name: string;
    level: number | null;
    usageCount: number;
    isExactMatch: boolean;
    isParentMatch: boolean;
    postCount: number;
}

interface PostDetail {
    id: string;
    interestId: string;
    caption: string | null;
    interest: { id: string; name: string };
    media: { id: string; url: string; type: string } | null;
}

interface ProfilePayload {
    id: string;
    displayName: string;
    revealed: boolean;
    distanceKm: number | null;
    distanceHidden?: boolean;
    exactDistance: boolean;
    lastActiveAt: string | null;
    score: number;
    compatibility: {
        baseInterestScore: number;
        exactMatches: number;
        parentMatches: number;
        categoryMatches: number;
        momentumBoost: number;
    };
    creativeCompatibility?: {
        score: number;
        sharedInterests: string[];
    };
    interests: InterestDetail[];
    posts: PostDetail[];
}

function timeSince(d: string | null) {
    if (!d) return null;
    const ms = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ── Segmented Progress Bar ────────────────────────────────────────────────────
function CompatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(248,250,252,0.55)', fontFamily: 'Inter,sans-serif' }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'Inter,sans-serif' }}>{value}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: color,
                    borderRadius: '3px',
                    boxShadow: `0 0 8px ${color}80`,
                    transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                }} />
            </div>
        </div>
    );
}

// ── Creative Compatibility Arc ────────────────────────────────────────────────
function CompatArc({ score }: { score: number }) {
    const clamped = Math.min(100, Math.max(0, score));
    const color = clamped >= 75 ? '#14b8a6' : clamped >= 50 ? '#8b5cf6' : '#ec4899';
    const r = 44;
    const circ = 2 * Math.PI * r;
    const dash = (clamped / 100) * circ;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track */}
                    <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                    {/* Arc */}
                    <circle
                        cx="50" cy="50" r={r} fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Inter,sans-serif', color, lineHeight: 1 }}>{clamped}</span>
                    <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(248,250,252,0.40)', fontFamily: 'Inter,sans-serif', letterSpacing: '0.06em' }}>/ 100</span>
                </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(248,250,252,0.45)', fontFamily: 'Inter,sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Creative Match
            </span>
        </div>
    );
}

// ── Post Grid (with lock overlay) ────────────────────────────────────────────
function PostCard({ post, revealed, idx }: { post: PostDetail; revealed: boolean; idx: number }) {
    const locked = !revealed && idx >= 3;
    return (
        <div style={{
            position: 'relative', aspectRatio: '1',
            borderRadius: '12px', overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            {post.media
                ? post.media.type === 'video'
                ? <video src={post.media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                : <img src={post.media.url} alt={post.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', background: 'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(236,72,153,0.06))' }}>🎨</div>
            }

            {/* Interest label */}
            <div style={{
                position: 'absolute', top: '6px', left: '6px',
                padding: '3px 8px', borderRadius: '999px',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                fontSize: '9px', fontWeight: 600, color: '#a78bfa',
                fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 12px)',
            }}>
                {post.interest.name}
            </div>

            {/* Lock overlay */}
            {locked && (
                <div style={{
                    position: 'absolute', inset: 0,
                    backdropFilter: 'blur(12px)',
                    background: 'rgba(10,10,15,0.70)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                    <div style={{ fontSize: '20px' }}>🔒</div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(248,250,252,0.50)', fontFamily: 'Inter,sans-serif', textAlign: 'center', padding: '0 8px' }}>
                        Match to unlock
                    </div>
                </div>
            )}

            {/* Caption hover overlay */}
            {!locked && post.caption && (
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '20px 10px 8px',
                    background: 'linear-gradient(to top,rgba(0,0,0,0.75),transparent)',
                    fontSize: '10px', color: 'rgba(248,250,252,0.80)',
                    fontFamily: 'Inter,sans-serif', lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {post.caption}
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfilePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [jwt, setJwt] = useState('');
    const [acting, setActing] = useState<'pass' | 'like' | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (stored) setJwt(stored);
        else { router.push('/login'); }
    }, [router]);

    const fetchProfile = useCallback(async (token: string) => {
        if (!token) return;
        setLoading(true); setError('');
        try {
            const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
            const res = await fetch(`/api/profile/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Profile fetch failed');
            setProfile(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        if (jwt && !profile && !error) fetchProfile(jwt);
    }, [jwt, profile, error, fetchProfile]);

    const handleInteraction = async (action: 'LIKE' | 'PASS') => {
        if (!profile || !jwt) return;
        setActing(action === 'LIKE' ? 'like' : 'pass');
        try {
            const res = await fetch('/api/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ targetId: profile.id, type: action }),
            });
            const data = await res.json();
            if (data.matched) router.push('/matches');
            else router.push('/feed');
        } catch {
            setActing(null);
        }
    };

    // ── Loading state ──
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', border: '2.5px solid rgba(255,255,255,0.10)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: '14px', color: 'rgba(248,250,252,0.38)', fontFamily: 'Inter,sans-serif' }}>Loading profile…</span>
        </div>
    );

    // ── Error state ──
    if (error || !profile) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', gap: '16px', padding: '24px' }}>
            <div style={{ fontSize: '36px' }}>⚠️</div>
            <div style={{ fontSize: '15px', color: '#fca5a5', fontFamily: 'Inter,sans-serif', textAlign: 'center' }}>{error || 'Profile not found'}</div>
            <button onClick={() => router.push('/feed')} style={{
                padding: '11px 24px', borderRadius: '999px',
                background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600, fontFamily: 'Inter,sans-serif',
            }}>
                ← Back to Feed
            </button>
        </div>
    );

    const isOnline = profile.lastActiveAt && (Date.now() - new Date(profile.lastActiveAt).getTime() < 3600000);
    const initials = profile.displayName.charAt(0).toUpperCase();

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, sans-serif', color: '#f8fafc', paddingBottom: '100px' }}>

            {/* ── Sticky Header ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                background: 'rgba(10,10,15,0.88)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <button onClick={() => router.back()} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: 'rgba(248,250,252,0.55)', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'Inter,sans-serif',
                }}>
                    ← Back
                </button>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    {profile.displayName}
                </span>
                <div style={{ width: '60px' }} />
            </header>

            <main style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* ── Hero identity card ── */}
                <div style={{
                    background: profile.revealed
                        ? 'linear-gradient(135deg,rgba(20,184,166,0.12),rgba(139,92,246,0.08))'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${profile.revealed ? 'rgba(20,184,166,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '20px', padding: '28px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                    textAlign: 'center', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.6s ease',
                }}>
                    {/* Top gradient line */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: profile.revealed
                            ? 'linear-gradient(90deg,#14b8a6,#8b5cf6,#ec4899)'
                            : 'linear-gradient(90deg,rgba(139,92,246,0.4),rgba(236,72,153,0.4))',
                        boxShadow: profile.revealed ? '0 0 12px rgba(20,184,166,0.5)' : 'none',
                    }} />

                    {/* Avatar circle */}
                    <div style={{
                        width: '88px', height: '88px', borderRadius: '50%',
                        background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                        padding: '3px',
                        boxShadow: profile.revealed ? '0 0 32px rgba(20,184,166,0.40)' : '0 0 20px rgba(139,92,246,0.30)',
                        transition: 'box-shadow 0.6s ease',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: '100%', height: '100%', borderRadius: '50%',
                            background: '#13131e',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '30px', fontWeight: 800, color: '#a78bfa',
                            filter: profile.revealed ? 'none' : 'blur(0px)',
                        }}>
                            {initials}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <h1 style={{
                            fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em',
                            color: '#f8fafc', margin: '0 0 6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap',
                        }}>
                            {profile.displayName}
                            {!profile.revealed && (
                                <span style={{ filter: 'blur(5px)', userSelect: 'none', opacity: 0.4, fontSize: '22px' }}>████</span>
                            )}
                            {isOnline && (
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', flexShrink: 0, display: 'inline-block' }} />
                            )}
                        </h1>

                        {/* Distance + activity */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            {!profile.distanceHidden && profile.distanceKm !== null && (
                                <span style={{ fontSize: '13px', color: 'rgba(248,250,252,0.50)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    📍 {profile.exactDistance ? profile.distanceKm?.toFixed(1) : `~${profile.distanceKm}`} km away
                                </span>
                            )}
                            {profile.lastActiveAt && (
                                <span style={{ fontSize: '12px', color: 'rgba(248,250,252,0.38)' }}>
                                    Active {timeSince(profile.lastActiveAt)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status badges row */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <CompatibilityBadge score={Math.round(profile.score)} size="md" />
                        {profile.revealed && (
                            <span style={{
                                padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                                background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.35)',
                                color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '5px',
                            }}>
                                🔓 Mutually Matched
                            </span>
                        )}
                        {!profile.revealed && (
                            <span style={{
                                padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                                color: 'rgba(248,250,252,0.45)',
                            }}>
                                🔒 Identity Hidden
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Compatibility Breakdown ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', color: '#f8fafc', margin: 0 }}>Compatibility</h2>
                        {profile.creativeCompatibility && (
                            <CompatArc score={profile.creativeCompatibility.score} />
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <CompatBar label="Interest Score" value={Math.round(profile.compatibility.baseInterestScore)} max={100} color="#8b5cf6" />
                        <CompatBar label="Exact Matches" value={profile.compatibility.exactMatches} max={Math.max(profile.compatibility.exactMatches, 5)} color="#ec4899" />
                        <CompatBar label="Related Interests" value={profile.compatibility.parentMatches} max={Math.max(profile.compatibility.parentMatches, 8)} color="#14b8a6" />
                        <CompatBar label="Category Overlap" value={profile.compatibility.categoryMatches} max={Math.max(profile.compatibility.categoryMatches, 10)} color="#a78bfa" />
                        {profile.compatibility.momentumBoost > 0 && (
                            <CompatBar label="Momentum Boost" value={Math.round(profile.compatibility.momentumBoost)} max={20} color="#f59e0b" />
                        )}
                    </div>

                    {/* Shared interests */}
                    {profile.creativeCompatibility && profile.creativeCompatibility.sharedInterests.length > 0 && (
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(248,250,252,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                                Shared Interests
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {profile.creativeCompatibility.sharedInterests.map(name => (
                                    <InterestTag key={name} name={name} isExactMatch size="sm" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Interests ── */}
                {profile.interests.length > 0 && (
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px', padding: '24px',
                    }}>
                        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
                            Interests
                            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: 'rgba(248,250,252,0.35)' }}>
                                {profile.interests.length}
                            </span>
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {profile.interests.map(ci => (
                                <div key={ci.interestId} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <InterestTag
                                        name={ci.name}
                                        isExactMatch={ci.isExactMatch}
                                        isParentMatch={ci.isParentMatch}
                                        size="md"
                                    />
                                    {ci.usageCount < 10 && (
                                        <span style={{
                                            fontSize: '9px', padding: '2px 6px', borderRadius: '999px',
                                            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                                            color: '#f59e0b', fontWeight: 600, fontFamily: 'Inter,sans-serif',
                                        }}>RARE</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {[
                                { color: 'rgba(139,92,246,0.5)', text: 'Exact match' },
                                { color: 'rgba(20,184,166,0.5)', text: 'Related' },
                                { color: 'rgba(255,255,255,0.15)', text: 'Other' },
                            ].map(({ color, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                                    <span style={{ fontSize: '10px', color: 'rgba(248,250,252,0.35)', fontFamily: 'Inter,sans-serif' }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Creative Works (Posts) ── */}
                {profile.posts.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>
                                Creative Works
                                <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: 'rgba(248,250,252,0.35)' }}>
                                    {profile.revealed ? profile.posts.length : `${Math.min(3, profile.posts.length)} of ${profile.posts.length}`}
                                </span>
                            </h2>
                            {!profile.revealed && (
                                <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(248,250,252,0.35)', fontFamily: 'Inter,sans-serif' }}>
                                    Match to unlock all
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                            {profile.posts.map((post, idx) => (
                                <PostCard key={post.id} post={post} revealed={profile.revealed} idx={idx} />
                            ))}
                        </div>
                    </div>
                )}

            </main>

            {/* ── Sticky action bar (only when NOT matched) ── */}
            {!profile.revealed && (
                <div style={{
                    position: 'fixed', bottom: '72px', left: 0, right: 0, zIndex: 50,
                    background: 'rgba(10,10,15,0.90)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    padding: '14px 20px',
                }}>
                    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => handleInteraction('PASS')}
                            disabled={!!acting}
                            style={{
                                flex: 1, padding: '13px', borderRadius: '12px',
                                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                                color: '#f87171', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter,sans-serif',
                                cursor: acting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (!acting) (e.currentTarget).style.background = 'rgba(239,68,68,0.18)'; }}
                            onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.10)'; }}
                        >
                            ✖ Pass
                        </button>
                        <button
                            onClick={() => handleInteraction('LIKE')}
                            disabled={!!acting}
                            style={{
                                flex: 2, padding: '13px', borderRadius: '12px',
                                background: acting === 'like' ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                                color: '#fff', fontSize: '14px', fontWeight: 700, fontFamily: 'Inter,sans-serif',
                                border: 'none', cursor: acting ? 'not-allowed' : 'pointer',
                                boxShadow: acting ? 'none' : '0 6px 20px rgba(139,92,246,0.35)',
                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            {acting === 'like' ? (
                                <>
                                    <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                    Liking…
                                </>
                            ) : '❤ Like Profile'}
                        </button>
                    </div>
                </div>
            )}

            {/* Matched: show message button instead */}
            {profile.revealed && (
                <div style={{
                    position: 'fixed', bottom: '72px', left: 0, right: 0, zIndex: 50,
                    padding: '14px 20px',
                    background: 'rgba(10,10,15,0.90)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(20,184,166,0.20)',
                }}>
                    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                        <a href="/matches" style={{
                            display: 'block', padding: '13px', borderRadius: '12px', textAlign: 'center',
                            background: 'linear-gradient(135deg,#14b8a6,#8b5cf6)',
                            color: '#fff', fontSize: '14px', fontWeight: 700, fontFamily: 'Inter,sans-serif',
                            textDecoration: 'none', boxShadow: '0 6px 20px rgba(20,184,166,0.30)',
                        }}>
                            💬 Send a Message
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
