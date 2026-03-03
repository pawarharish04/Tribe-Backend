'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { type ProfileData, type Stats, type PostItem } from '../../../components/profile/ProfileEditor';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STRENGTH_LABELS: Record<number, string> = { 1: 'Curious', 2: 'Serious', 3: 'Core' };
const STRENGTH_COLORS: Record<number, string> = {
    1: 'var(--text-muted)',
    2: 'var(--gold)',
    3: 'var(--accent)',
};

function timeSince(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(ms / 86400000);
    if (d > 0) return `${d}d ago`;
    const h = Math.floor(ms / 3600000);
    if (h > 0) return `${h}h ago`;
    const m = Math.floor(ms / 60000);
    if (m > 0) return `${m}m ago`;
    return 'just now';
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView({ profile, stats }: { profile: ProfileData; stats: Stats }) {
    const initial = profile.name ? profile.name.charAt(0).toUpperCase() : '?';
    const [activePost, setActivePost] = useState<PostItem | null>(null);
    const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (activePost) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [activePost]);

    // Group posts by interest
    const postsByInterest: Record<string, { name: string; posts: PostItem[] }> = {};
    for (const post of profile.interestPosts) {
        const key = post.interest.id;
        if (!postsByInterest[key]) postsByInterest[key] = { name: post.interest.name, posts: [] };
        postsByInterest[key].posts.push(post);
    }

    return (
        <div style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '40px 20px 80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
        }}>

            {/* ── Hero card ── */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '32px 28px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '24px',
                position: 'relative',
            }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                    {profile.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt={profile.name ?? 'Avatar'}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                objectFit: 'cover', border: '2px solid var(--border)',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'var(--accent-soft)',
                            border: '2px solid var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '28px', fontWeight: 700, color: 'var(--accent)',
                        }}>
                            {initial}
                        </div>
                    )}
                </div>

                {/* Name + bio */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '22px', fontWeight: 700,
                        letterSpacing: '-0.02em', color: 'var(--text-primary)',
                        marginBottom: '6px',
                    }}>
                        {profile.name ?? 'Anonymous'}
                    </div>

                    {profile.bio && (
                        <p style={{
                            fontSize: '14px', color: 'var(--text-secondary)',
                            lineHeight: 1.6, marginBottom: '12px',
                        }}>
                            {profile.bio}
                        </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {profile.locationEnabled && (
                            <span style={{
                                fontSize: '12px', color: 'var(--text-muted)',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border)',
                                borderRadius: '20px', padding: '3px 10px',
                            }}>
                                📍 Location enabled
                            </span>
                        )}
                        <span style={{
                            fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px',
                            color: 'var(--green)',
                            background: 'var(--green-soft)',
                            border: '1px solid rgba(74,222,128,0.2)',
                            borderRadius: '20px', padding: '3px 10px',
                        }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: 'var(--green)', display: 'inline-block',
                            }} />
                            Online
                        </span>
                    </div>
                </div>

                {/* Edit button — top right */}
                <Link href="/me/edit" style={{
                    position: 'absolute', top: '24px', right: '24px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '13px', fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'opacity 0.15s ease',
                }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                    Edit Profile
                </Link>
            </div>

            {/* ── Stats ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
            }}>
                {[
                    { label: 'Matches', value: stats.matches, color: 'var(--accent)' },
                    { label: 'Post Likes', value: stats.postLikes, color: 'var(--gold)' },
                    { label: 'Messages Sent', value: stats.messagesSent, color: 'var(--green)' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{
                        padding: '20px 16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '32px', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                            {value}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {label}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Interests ── */}
            {profile.interests.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '28px',
                }}>
                    <h2 style={sectionTitle}>Interests</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {profile.interests.map(item => (
                            <div key={item.id} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px',
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${STRENGTH_COLORS[item.level]}33`,
                                borderRadius: '20px',
                            }}>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {item.interest.name}
                                </span>
                                <span style={{
                                    fontSize: '10px', fontWeight: 700,
                                    color: STRENGTH_COLORS[item.level],
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                }}>
                                    {STRENGTH_LABELS[item.level]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Interest Posts Portfolio ── */}
            {Object.keys(postsByInterest).length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '28px',
                }}>
                    <h2 style={sectionTitle}>Portfolio</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {Object.entries(postsByInterest).map(([interestId, group]) => (
                            <div key={interestId}>
                                <div style={{
                                    fontSize: '12px', fontWeight: 600,
                                    color: 'var(--accent)', letterSpacing: '0.06em',
                                    textTransform: 'uppercase', marginBottom: '12px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <span style={{
                                        display: 'inline-block', width: '6px', height: '6px',
                                        borderRadius: '50%', background: 'var(--accent)',
                                    }} />
                                    {group.name}
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                                        {group.posts.length} {group.posts.length === 1 ? 'post' : 'posts'}
                                    </span>
                                </div>

                                {/* Square grid — persistent stats below each tile */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '10px',
                                }}>
                                    {group.posts.map(post => {
                                        const isHovered = hoveredPostId === post.id;
                                        const hasMedia = !!post.media;
                                        return (
                                            <div
                                                key={post.id}
                                                onMouseEnter={() => setHoveredPostId(post.id)}
                                                onMouseLeave={() => setHoveredPostId(null)}
                                                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                                            >
                                                {/* Square image tile */}
                                                <div
                                                    onClick={() => setActivePost(post)}
                                                    style={{
                                                        position: 'relative',
                                                        aspectRatio: '1 / 1',
                                                        borderRadius: 'var(--radius-sm)',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        background: 'var(--border-subtle)',
                                                        border: `1px solid ${isHovered ? 'var(--accent)' : 'var(--border)'}`,
                                                        transition: 'border-color 0.2s ease',
                                                    }}
                                                >
                                                    {hasMedia ? (
                                                        post.media!.type === 'video' ? (
                                                            <video
                                                                src={post.media!.url}
                                                                style={{
                                                                    width: '100%', height: '100%',
                                                                    objectFit: 'cover',
                                                                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                                                    transition: 'transform 0.3s ease',
                                                                }}
                                                                muted
                                                            />
                                                        ) : (
                                                            <img
                                                                src={post.media!.url}
                                                                alt={post.caption ?? ''}
                                                                style={{
                                                                    width: '100%', height: '100%',
                                                                    objectFit: 'cover',
                                                                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                                                    transition: 'transform 0.3s ease',
                                                                }}
                                                            />
                                                        )
                                                    ) : (
                                                        /* Text-only post tile */
                                                        <div style={{
                                                            width: '100%', height: '100%',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: '12px',
                                                            fontSize: '12px', color: 'var(--text-secondary)',
                                                            textAlign: 'center', lineHeight: 1.4,
                                                        }}>
                                                            {post.caption ?? '✦'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Persistent stats — always visible below tile */}
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '2px',
                                                    paddingLeft: '2px',
                                                }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        color: 'var(--accent)',
                                                        letterSpacing: '0.04em',
                                                        textTransform: 'uppercase',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {post.interest.name}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: isHovered ? 'var(--text-secondary)' : 'var(--text-muted)',
                                                        transition: 'color 0.2s ease',
                                                    }}>
                                                        ♥ {post._count.likes}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty portfolio placeholder */}
            {Object.keys(postsByInterest).length === 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '48px 28px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🖼️</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
                        No portfolio yet
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Add interest posts to showcase what you&apos;re into.
                    </div>
                    <Link href="/me/edit" style={{
                        display: 'inline-block', padding: '9px 20px',
                        borderRadius: 'var(--radius-sm)', background: 'var(--accent)',
                        color: '#fff', fontSize: '13px', fontWeight: 600,
                        textDecoration: 'none',
                    }}>
                        Add Posts
                    </Link>
                </div>
            )}

            {/* ── Fullscreen Modal ── */}
            {activePost && (
                <div
                    onClick={() => setActivePost(null)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        animation: 'fadeIn 0.18s ease',
                    }}
                >
                    {/* Modal content — stop propagation so inner clicks don't close */}
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            maxWidth: '680px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            position: 'relative',
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setActivePost(null)}
                            style={{
                                position: 'absolute', top: '14px', right: '14px',
                                zIndex: 10,
                                width: '32px', height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '16px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                lineHeight: 1,
                            }}
                        >
                            ✕
                        </button>

                        {/* Media */}
                        {activePost.media && (
                            activePost.media.type === 'video' ? (
                                <video
                                    src={activePost.media.url}
                                    style={{ width: '100%', borderRadius: 'var(--radius) var(--radius) 0 0', display: 'block', maxHeight: '60vh', objectFit: 'contain', background: '#000' }}
                                    controls
                                    autoPlay
                                    muted
                                />
                            ) : (
                                <img
                                    src={activePost.media.url}
                                    alt={activePost.caption ?? ''}
                                    style={{ width: '100%', borderRadius: 'var(--radius) var(--radius) 0 0', display: 'block', maxHeight: '60vh', objectFit: 'contain', background: '#000' }}
                                />
                            )
                        )}

                        {/* Meta */}
                        <div style={{ padding: '20px 24px 24px' }}>
                            {/* Interest tag */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '4px 12px',
                                background: 'var(--accent-soft)',
                                border: '1px solid var(--accent)',
                                borderRadius: '20px',
                                fontSize: '11px', fontWeight: 600,
                                color: 'var(--accent)',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                marginBottom: '14px',
                            }}>
                                {activePost.interest.name}
                            </div>

                            {/* Caption */}
                            {activePost.caption && (
                                <p style={{
                                    fontSize: '15px', color: 'var(--text-primary)',
                                    lineHeight: 1.6, marginBottom: '16px',
                                }}>
                                    {activePost.caption}
                                </p>
                            )}

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    ♥ {activePost._count.likes} {activePost._count.likes === 1 ? 'like' : 'likes'}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {timeSince(activePost.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}

const sectionTitle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '20px',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) { router.push('/login'); return; }

        fetch('/api/me', { headers: { Authorization: `Bearer ${stored}` } })
            .then(res => {
                if (res.status === 401) { router.push('/login'); return null; }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (data.error) { setError(data.error); return; }
                const p: ProfileData = {
                    ...data.user,
                    interestPosts: (data.user.interestPosts ?? []).map((post: any) => ({
                        ...post,
                        createdAt: typeof post.createdAt === 'string'
                            ? post.createdAt
                            : new Date(post.createdAt).toISOString(),
                    })),
                };
                setProfile(p);
                setStats(data.stats);
            })
            .catch(() => setError('Failed to load profile.'))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 'calc(100vh - 56px)', color: 'var(--text-muted)', fontSize: '14px',
            }}>
                Loading profile…
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: '12px',
                color: 'var(--red)', fontSize: '14px',
            }}>
                <div style={{ fontSize: '32px' }}>⚠️</div>
                {error}
            </div>
        );
    }

    if (!profile || !stats) return null;

    return <ProfileView profile={profile} stats={stats} />;
}
