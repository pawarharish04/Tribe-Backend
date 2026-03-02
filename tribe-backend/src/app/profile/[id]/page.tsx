'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
    interests: InterestDetail[];
    posts: PostDetail[];
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

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfilePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [jwt, setJwt] = useState('');
    // For interaction
    const [acting, setActing] = useState<'pass' | 'like' | null>(null);

    // Initial load try session storage
    useEffect(() => {
        const storedJwt = localStorage.getItem('tribe_jwt');
        if (storedJwt) {
            setJwt(storedJwt);
        } else {
            setError('Unauthorized. Please log in.');
            router.push('/login');
        }
    }, [router]);

    const fetchProfile = useCallback(async (token: string) => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            // Next 14 handles params as object, Next 15 as Promise, useParams hook handles it
            const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
            const res = await fetch(`/api/profile/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Profile fetch failed');
            setProfile(data);

            // save locally for easy refresh
            localStorage.setItem('tribe_jwt', token);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [params]);

    // Handle initial fetch when JWT is available
    useEffect(() => {
        if (jwt && !profile && !error) {
            fetchProfile(jwt);
        }
    }, [jwt, profile, error, fetchProfile]);


    const handleInteraction = async (action: 'LIKE' | 'PASS') => {
        if (!profile || !jwt) return;
        setActing(action === 'LIKE' ? 'like' : 'pass');
        try {
            const res = await fetch('/api/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ targetId: profile.id, type: action }) // `type` not `action`
            });
            const data = await res.json();
            if (data.matched) {
                // It's a mutual match — route to matches so they see the reveal
                router.push('/matches');
            } else {
                // Normal like/pass — return to feed
                router.push('/feed');
            }
        } catch {
            setActing(null);
        }
    };


    if (!jwt && !loading) {
        return null;
    }

    if (loading) {
        return (
            <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Loading Profile...
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px', color: 'var(--red)' }}>
                Error: {error || 'Profile not found'}
                <br />
                <button onClick={() => router.push('/feed')} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--bg-card)', color: '#fff' }}>Back to Feed</button>
            </div>
        );
    }

    const isOnline = profile.lastActiveAt && (Date.now() - new Date(profile.lastActiveAt).getTime() < 3600000); // 1 hr

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Nav */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                borderBottom: '1px solid var(--border)', background: 'rgba(12,12,14,0.9)',
                backdropFilter: 'blur(16px)', padding: '0 24px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <button onClick={() => router.back()} style={{ color: 'var(--text-secondary)', background: 'none', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← Back
                </button>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{profile.displayName}</span>
                <div style={{ width: '40px' }} /> {/* Spacer */}
            </header>

            <main style={{ flex: 1, maxWidth: '640px', width: '100%', margin: '0 auto', padding: '24px 20px 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* 1. Identity Header */}
                <div style={{
                    textAlign: 'center', padding: '30px 20px', background: 'var(--bg-card)',
                    borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden'
                }}>
                    {!profile.revealed && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #555, #333)' }} />
                    )}
                    {profile.revealed && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #4ade80, #22d3ee)', boxShadow: '0 0 12px rgba(74,222,128,0.5)' }} />
                    )}

                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--border)', color: '#fff', fontSize: '32px', fontWeight: 600, marginBottom: '16px' }}>
                        {profile.displayName.charAt(0)}
                    </div>

                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {profile.displayName}
                        {!profile.revealed && <span style={{ filter: 'blur(6px)', userSelect: 'none', marginLeft: '4px', opacity: 0.5, fontSize: '24px' }}>████</span>}
                        {isOnline && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)' }} />}
                    </h1>

                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
                        {profile.distanceHidden
                            ? 'Distance hidden'
                            : profile.distanceKm !== null
                                ? `${profile.distanceKm}${profile.exactDistance ? '.0' : ''} km away`
                                : 'Unknown location'}
                    </div>
                    {profile.lastActiveAt && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                            Active {timeSince(profile.lastActiveAt)}
                        </div>
                    )}

                    {profile.revealed && (
                        <div style={{ display: 'inline-block', marginTop: '16px', padding: '4px 12px', background: 'var(--green-soft)', color: 'var(--green)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(74,222,128,0.3)' }}>
                            🔓 Mutual Match
                        </div>
                    )}
                </div>

                {/* 2. Shared Compatibility Section */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Compatibility Breakdown</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: profile.score >= 70 ? 'var(--green)' : profile.score >= 45 ? 'var(--gold)' : 'var(--text-secondary)' }}>
                            {Math.round(profile.score)}%
                        </div>
                    </div>

                    {/* Visual Meter */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{ width: `${Math.min(profile.score, 100)}%`, height: '100%', background: profile.score >= 70 ? 'var(--green)' : profile.score >= 45 ? 'var(--gold)' : 'var(--text-secondary)', transition: 'width 1s ease-out' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent)' }}>{profile.compatibility.exactMatches}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Exact Matches</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{profile.compatibility.parentMatches}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Related Interests</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)' }}>+{Math.round(profile.compatibility.momentumBoost)}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Momentum Boost</div>
                        </div>
                    </div>
                </div>

                {/* 3. Interest Breakdown */}
                <div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
                        Analyzed Interests ({profile.interests.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {profile.interests.map(ci => (
                            <div key={ci.interestId} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', background: 'var(--bg-card)', border: `1px solid ${ci.isExactMatch ? 'rgba(124,106,247,0.3)' : 'var(--border)'}`,
                                borderRadius: '10px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: ci.isExactMatch ? 600 : 500, color: ci.isExactMatch ? 'var(--accent)' : 'var(--text-primary)' }}>
                                        {ci.name}
                                    </div>
                                    {ci.isExactMatch && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '12px' }}>Shared</span>}
                                    {ci.usageCount < 10 && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--gold)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>Rare</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {ci.postCount > 0 ? `${ci.postCount} Posts` : 'No Posts'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Expression Wall (Posts) */}
                {profile.posts.length > 0 && (
                    <div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
                            expression wall {!profile.revealed && `(Locked Preview)`}
                        </div>
                        <div style={{ position: 'relative' }}>
                            {!profile.revealed && (
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(transparent, var(--bg))', zIndex: 2 }} />
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                {profile.posts.map((post, i) => (
                                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginBottom: '6px' }}>
                                            {post.interest.name}
                                        </div>
                                        {post.caption && (
                                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '8px' }}>
                                                "{post.caption}"
                                            </div>
                                        )}
                                        {post.media && (
                                            <div style={{ height: '120px', background: 'var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                                [{post.media.type === 'video' ? '🎥 Video' : '🖼️ Image'}]
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Interaction Footer */}
                {!profile.revealed && (
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        background: 'rgba(12,12,14,0.95)', borderTop: '1px solid var(--border)',
                        padding: '16px 24px 32px', display: 'flex', gap: '12px', zIndex: 100,
                        backdropFilter: 'blur(16px)'
                    }}>
                        <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => handleInteraction('PASS')}
                                disabled={!!acting}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '15px', fontWeight: 600 }}
                            >
                                Pass
                            </button>
                            <button
                                onClick={() => handleInteraction('LIKE')}
                                disabled={!!acting}
                                style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'var(--accent)', color: '#fff', fontSize: '15px', fontWeight: 600 }}
                            >
                                {acting === 'like' ? 'Liking...' : 'Like Profile'}
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
