'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../../../components/ui/StatCard';
import InterestTag from '../../../components/ui/InterestTag';

interface PostItem {
    id: string;
    caption: string | null;
    createdAt: string;
    interest: { id: string; name: string };
    media: { id: string; url: string; type: string } | null;
    _count: { likes: number };
}

interface ProfileData {
    id: string;
    name: string | null;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
    locationEnabled: boolean;
    createdAt: string;
    interests: { id: string; level: number; interest: { id: string; name: string } }[];
    interestPosts: PostItem[];
}

interface Stats { matches: number; postLikes: number; messagesSent: number; }

function timeSince(d: string) {
    const ms = Date.now() - new Date(d).getTime();
    const days = Math.floor(ms / 86400000);
    if (days >= 7) return `${Math.floor(days / 7)}w`;
    if (days > 0) return `${days}d`;
    const h = Math.floor(ms / 3600000);
    if (h > 0) return `${h}h`;
    return `${Math.floor(ms / 60000)}m`;
}

// ── Post Grid Cell ────────────────────────────────────────────────────────────
function PostCell({ post }: { post: PostItem }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: hov ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
            }}
        >
            {post.media
                ? post.media.type === 'video'
                ? <video src={post.media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                : <img src={post.media.url} alt={post.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.08))',
                        fontSize: '32px',
                    }}>🎨</div>
                )
            }

            {/* Hover overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                opacity: hov ? 1 : 0, transition: 'opacity 0.2s',
            }}>
                <div style={{ fontSize: '20px' }}>♥</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>{post._count.likes}</div>
            </div>

            {/* Like badge (always visible) */}
            {!hov && post._count.likes > 0 && (
                <div style={{
                    position: 'absolute', bottom: '6px', right: '6px',
                    padding: '3px 8px', borderRadius: '999px',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    fontSize: '10px', fontWeight: 600, color: '#f8fafc', fontFamily: 'Inter,sans-serif',
                    display: 'flex', alignItems: 'center', gap: '3px',
                }}>
                    <span>♥</span>{post._count.likes}
                </div>
            )}

            {/* Interest label */}
            <div style={{
                position: 'absolute', top: '6px', left: '6px',
                padding: '3px 8px', borderRadius: '999px',
                background: 'rgba(139,92,246,0.4)', backdropFilter: 'blur(8px)',
                fontSize: '9px', fontWeight: 600, color: '#c4b5fd', fontFamily: 'Inter,sans-serif',
                maxWidth: 'calc(100% - 12px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                {post.interest.name}
            </div>
        </div>
    );
}

// ── Upload Post Button ────────────────────────────────────────────────────────
function UploadButton() {
    return (
        <a href="/me/edit" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            aspectRatio: '1', borderRadius: '12px',
            border: '1.5px dashed rgba(139,92,246,0.35)',
            background: 'rgba(139,92,246,0.05)',
            cursor: 'pointer', textDecoration: 'none',
            gap: '8px', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(139,92,246,0.65)'; (e.currentTarget).style.background = 'rgba(139,92,246,0.10)'; }}
        onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(139,92,246,0.35)'; (e.currentTarget).style.background = 'rgba(139,92,246,0.05)'; }}
        >
            <span style={{ fontSize: '24px' }}>+</span>
            <span style={{ fontSize: '11px', color: 'rgba(139,92,246,0.7)', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>Add Work</span>
        </a>
    );
}

// ── Main Profile View ─────────────────────────────────────────────────────────
function ProfileView({ profile, stats }: { profile: ProfileData; stats: Stats }) {
    const initials = (profile.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const memberSince = new Date(profile.createdAt).getFullYear();

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f8fafc', fontFamily: 'Inter, sans-serif', paddingBottom: '40px' }}>

            {/* ── Top actions bar ── */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100,
                padding: '14px 20px',
                background: 'rgba(10,10,15,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: '#fff',
                    }}>{initials.charAt(0)}</div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,250,252,0.80)' }}>{profile.name ?? 'My Profile'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ label: 'Edit Profile', href: '/me/edit', primary: true }, { label: 'Settings', href: '/settings', primary: false }].map((btn, i) => (
                        <a key={i} href={btn.href} style={{
                            padding: '7px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                            fontFamily: 'Inter,sans-serif', textDecoration: 'none',
                            background: btn.primary ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(255,255,255,0.06)',
                            border: btn.primary ? 'none' : '1px solid rgba(255,255,255,0.12)',
                            color: '#fff',
                            boxShadow: btn.primary ? '0 4px 12px rgba(139,92,246,0.30)' : 'none',
                            transition: 'all 0.2s',
                        }}>
                            {btn.label}
                        </a>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>

                {/* ── Hero card ── */}
                <div style={{
                    marginTop: '24px',
                    background: 'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(236,72,153,0.06))',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '20px',
                    padding: '28px',
                    display: 'flex', gap: '24px', alignItems: 'flex-start',
                    backdropFilter: 'blur(20px)',
                }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: '88px', height: '88px', borderRadius: '50%',
                            background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                            padding: '3px',
                            boxShadow: '0 0 32px rgba(139,92,246,0.35)',
                        }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0f0f18', overflow: 'hidden' }}>
                                {profile.avatarUrl
                                    ? <img src={profile.avatarUrl} alt={profile.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: '#a78bfa' }}>{initials}</div>
                                }
                            </div>
                        </div>
                        {/* Online dot */}
                        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#10b981', border: '2.5px solid #0a0a0f' }} />
                    </div>

                    {/* Identity */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc', margin: 0 }}>
                                {profile.name ?? 'Anonymous'}
                            </h1>
                            <span style={{ fontSize: '11px', color: 'rgba(248,250,252,0.35)', padding: '3px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.10)', flexShrink: 0 }}>
                                Member since {memberSince}
                            </span>
                        </div>

                        <div style={{ fontSize: '13px', color: 'rgba(248,250,252,0.45)', marginTop: '4px' }}>{profile.email}</div>

                        {profile.bio && (
                            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(248,250,252,0.65)', marginTop: '10px', margin: '10px 0 0' }}>
                                {profile.bio}
                            </p>
                        )}

                        {/* Location status */}
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '999px',
                                background: profile.locationEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${profile.locationEnabled ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.10)'}`,
                                color: profile.locationEnabled ? '#10b981' : 'rgba(248,250,252,0.35)',
                            }}>
                                {profile.locationEnabled ? '📍 Location on' : '📍 Location off'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Stats row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
                    <StatCard label="Matches" value={stats.matches} icon="💫" accent="purple" />
                    <StatCard label="Post Likes" value={stats.postLikes} icon="♥" accent="pink" />
                    <StatCard label="Messages" value={stats.messagesSent} icon="💬" accent="teal" />
                </div>

                {/* ── Interests ── */}
                {profile.interests.length > 0 && (
                    <div style={{ marginTop: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>Interests</h2>
                            <a href="/me/edit" style={{ fontSize: '12px', color: '#8b5cf6', textDecoration: 'none', fontWeight: 500 }}>Edit →</a>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {profile.interests.map(ui => (
                                <InterestTag key={ui.id} name={ui.interest.name} isExactMatch={ui.level >= 3} size="md" />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Creative Works Grid ── */}
                <div style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                            Creative Works
                            <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 400, color: 'rgba(248,250,252,0.35)' }}>
                                {profile.interestPosts.length}
                            </span>
                        </h2>
                        <a href="/me/edit" style={{ fontSize: '12px', color: '#8b5cf6', textDecoration: 'none', fontWeight: 500 }}>Upload →</a>
                    </div>

                    {profile.interestPosts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '14px' }}>🎨</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(248,250,252,0.55)', marginBottom: '8px' }}>No works published yet</div>
                            <div style={{ fontSize: '13px', color: 'rgba(248,250,252,0.35)', marginBottom: '20px' }}>Share your creative output to be discovered</div>
                            <a href="/me/edit" style={{
                                display: 'inline-block', padding: '10px 24px', borderRadius: '999px',
                                background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                                color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                                boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
                            }}>Add First Work →</a>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            <UploadButton />
                            {profile.interestPosts.map(post => <PostCell key={post.id} post={post} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const jwt = localStorage.getItem('tribe_jwt');
        if (!jwt) { router.push('/login'); return; }
        fetch('/api/me', { headers: { Authorization: `Bearer ${jwt}` } })
            .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
            .then(d => {
                if (!d) return;
                if (d.error) { setError(d.error); return; }
                setProfile({ ...d.user, interestPosts: (d.user.interestPosts ?? []).map((p: PostItem) => ({ ...p, createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString() })) });
                setStats(d.stats);
            })
            .catch(() => setError('Failed to load profile.'))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', border: '2.5px solid rgba(255,255,255,0.10)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: '14px', color: 'rgba(248,250,252,0.40)', fontFamily: 'Inter,sans-serif' }}>Loading profile…</span>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', color: '#fca5a5', fontFamily: 'Inter,sans-serif', fontSize: '14px' }}>
            {error}
        </div>
    );

    if (!profile || !stats) return null;
    return <ProfileView profile={profile} stats={stats} />;
}
