'use client';

import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserInterestItem {
    id: string;
    level: number;
    interest: { id: string; name: string };
}

export interface PostItem {
    id: string;
    caption: string | null;
    createdAt: string;
    interest: { id: string; name: string };
    media: { id: string; url: string; type: string } | null;
    _count: { likes: number };
}

export interface ProfileData {
    id: string;
    name: string | null;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
    locationEnabled: boolean;
    interests: UserInterestItem[];
    interestPosts: PostItem[];
}

export interface Stats {
    matches: number;
    postLikes: number;
    messagesSent: number;
}

interface ProfileEditorProps {
    profile: ProfileData;
    stats: Stats;
    jwt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STRENGTH_LABELS: Record<number, string> = {
    1: 'CURIOUS',
    2: 'SERIOUS',
    3: 'CORE',
};

const STRENGTH_COLORS: Record<number, string> = {
    1: 'var(--text-muted)',
    2: 'var(--gold)',
    3: 'var(--accent)',
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '28px 28px 24px',
        }}>
            <h2 style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '20px',
            }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

// ─── Small save feedback ──────────────────────────────────────────────────────

function SaveFeedback({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
    if (status === 'idle') return null;
    const color = status === 'error' ? 'var(--red)' : status === 'saved' ? 'var(--green)' : 'var(--text-muted)';
    const label = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Error — try again';
    return <span style={{ fontSize: '12px', color, marginLeft: '10px', transition: 'opacity 0.2s' }}>{label}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileEditor({ profile, stats, jwt }: ProfileEditorProps) {
    // ── SECTION 1: Profile Header ──────────────────────────────────────────────
    const [name, setName] = useState(profile.name ?? '');
    const [bio, setBio] = useState(profile.bio ?? '');
    const [locationEnabled, setLocationEnabled] = useState(profile.locationEnabled);
    const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const saveProfile = async () => {
        setProfileStatus('saving');
        try {
            const res = await fetch('/api/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ name, bio, locationEnabled }),
            });
            setProfileStatus(res.ok ? 'saved' : 'error');
        } catch {
            setProfileStatus('error');
        } finally {
            setTimeout(() => setProfileStatus('idle'), 2500);
        }
    };

    // ── SECTION 2: Interests ───────────────────────────────────────────────────
    const [interests, setInterests] = useState<UserInterestItem[]>(profile.interests);
    const [allInterests, setAllInterests] = useState<{ id: string; name: string }[]>([]);
    const [newInterestId, setNewInterestId] = useState('');
    const [interestStatus, setInterestStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        // Load all available interests for the Add dropdown
        fetch('/api/interests', { headers: { Authorization: `Bearer ${jwt}` } })
            .then(r => r.json())
            .then(data => setAllInterests(data.interests ?? []))
            .catch(() => { /* soft fail */ });
    }, [jwt]);

    const saveInterests = async (updated: UserInterestItem[]) => {
        setInterestStatus('saving');
        try {
            const res = await fetch('/api/me/interests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({
                    interests: updated.map(i => ({ interestId: i.interest.id, level: i.level })),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setInterests(data.interests);
                setInterestStatus('saved');
            } else {
                setInterestStatus('error');
            }
        } catch {
            setInterestStatus('error');
        } finally {
            setTimeout(() => setInterestStatus('idle'), 2500);
        }
    };

    const changeStrength = (interestId: string, level: number) => {
        const updated = interests.map(i =>
            i.interest.id === interestId ? { ...i, level } : i
        );
        setInterests(updated);
        saveInterests(updated);
    };

    const removeInterest = (interestId: string) => {
        const updated = interests.filter(i => i.interest.id !== interestId);
        setInterests(updated);
        saveInterests(updated);
    };

    const addInterest = () => {
        if (!newInterestId) return;
        if (interests.find(i => i.interest.id === newInterestId)) return;
        const found = allInterests.find(i => i.id === newInterestId);
        if (!found) return;
        const updated: UserInterestItem[] = [
            ...interests,
            { id: `local-${Date.now()}`, level: 1, interest: { id: found.id, name: found.name } },
        ];
        setInterests(updated);
        setNewInterestId('');
        saveInterests(updated);
    };

    // ── SECTION 3: Posts ───────────────────────────────────────────────────────
    const [posts, setPosts] = useState<PostItem[]>(profile.interestPosts);
    const [newPostInterestId, setNewPostInterestId] = useState('');
    const [newPostCaption, setNewPostCaption] = useState('');
    const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
    const [newPostMediaType, setNewPostMediaType] = useState<'image' | 'video'>('image');
    const [postSubmitting, setPostSubmitting] = useState(false);
    const [postError, setPostError] = useState('');

    const submitPost = async () => {
        if (!newPostInterestId) { setPostError('Select an interest.'); return; }
        setPostSubmitting(true);
        setPostError('');
        try {
            const res = await fetch('/api/me/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({
                    interestId: newPostInterestId,
                    caption: newPostCaption,
                    mediaUrl: newPostMediaUrl || undefined,
                    mediaType: newPostMediaUrl ? newPostMediaType : undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setPosts(prev => [data.post, ...prev]);
                setNewPostInterestId('');
                setNewPostCaption('');
                setNewPostMediaUrl('');
            } else {
                setPostError(data.error ?? 'Failed to create post');
            }
        } catch {
            setPostError('Network error');
        } finally {
            setPostSubmitting(false);
        }
    };

    const deletePost = async (postId: string) => {
        // Optimistic
        setPosts(prev => prev.filter(p => p.id !== postId));
        try {
            const res = await fetch(`/api/me/posts?id=${postId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (!res.ok) {
                // Revert if failed — refetch would be overkill, just alert
                console.error('Delete failed');
            }
        } catch {
            console.error('Delete network error');
        }
    };

    // Group posts by interest
    const postsByInterest: Record<string, { name: string; posts: PostItem[] }> = {};
    for (const post of posts) {
        const key = post.interest.id;
        if (!postsByInterest[key]) {
            postsByInterest[key] = { name: post.interest.name, posts: [] };
        }
        postsByInterest[key].posts.push(post);
    }

    // ── RENDER ─────────────────────────────────────────────────────────────────

    return (
        <div style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '32px 20px 80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
        }}>
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Your Profile
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Manage how others discover you on Tribe.
                </p>
            </div>

            {/* ── SECTION 1: Profile Header ── */}
            <Section title="Profile">
                {/* Avatar preview */}
                {profile.avatarUrl && (
                    <div style={{ marginBottom: '16px' }}>
                        <img
                            src={profile.avatarUrl}
                            alt="Avatar"
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Display Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your name"
                            maxLength={100}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({bio.length}/500)</span></label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="A short line about you…"
                            maxLength={500}
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                        />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={locationEnabled}
                            onChange={e => setLocationEnabled(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Enable location — show distance to others
                        </span>
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={saveProfile} disabled={profileStatus === 'saving'} style={primaryBtn}>
                            {profileStatus === 'saving' ? 'Saving…' : 'Save Profile'}
                        </button>
                        <SaveFeedback status={profileStatus} />
                    </div>
                </div>
            </Section>

            {/* ── SECTION 2: Interests ── */}
            <Section title="Interests">
                {/* Current interests */}
                {interests.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>No interests yet. Add one below.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        {interests.map(item => (
                            <div key={item.interest.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                            }}>
                                <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                    {item.interest.name}
                                </span>

                                <select
                                    value={item.level}
                                    onChange={e => changeStrength(item.interest.id, Number(e.target.value))}
                                    style={{
                                        ...selectStyle,
                                        color: STRENGTH_COLORS[item.level],
                                        fontWeight: 600,
                                        fontSize: '11px',
                                    }}
                                >
                                    <option value={1}>CURIOUS</option>
                                    <option value={2}>SERIOUS</option>
                                    <option value={3}>CORE</option>
                                </select>

                                <button
                                    onClick={() => removeInterest(item.interest.id)}
                                    style={ghostBtn}
                                    title="Remove interest"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add new interest */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={newInterestId}
                        onChange={e => setNewInterestId(e.target.value)}
                        style={{ ...selectStyle, flex: 1, minWidth: '160px' }}
                    >
                        <option value="">Select an interest…</option>
                        {allInterests
                            .filter(a => !interests.find(i => i.interest.id === a.id))
                            .map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                    </select>
                    <button onClick={addInterest} disabled={!newInterestId} style={primaryBtn}>
                        Add
                    </button>
                    <SaveFeedback status={interestStatus} />
                </div>
            </Section>

            {/* ── SECTION 3: Interest Posts ── */}
            <Section title="Interest Posts">
                {/* Add post form */}
                <div style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>New Post</div>

                    <select
                        value={newPostInterestId}
                        onChange={e => setNewPostInterestId(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Select interest…</option>
                        {interests.map(i => (
                            <option key={i.interest.id} value={i.interest.id}>{i.interest.name}</option>
                        ))}
                    </select>

                    <textarea
                        value={newPostCaption}
                        onChange={e => setNewPostCaption(e.target.value)}
                        placeholder="Caption (optional)…"
                        maxLength={500}
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                            value={newPostMediaUrl}
                            onChange={e => setNewPostMediaUrl(e.target.value)}
                            placeholder="Media URL (image/video, optional)"
                            style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
                        />
                        <select
                            value={newPostMediaType}
                            onChange={e => setNewPostMediaType(e.target.value as 'image' | 'video')}
                            style={{ ...selectStyle, width: '100px', flexShrink: 0 }}
                        >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                    </div>

                    {postError && (
                        <div style={{ fontSize: '12px', color: 'var(--red)' }}>{postError}</div>
                    )}

                    <button onClick={submitPost} disabled={postSubmitting} style={primaryBtn}>
                        {postSubmitting ? 'Posting…' : 'Add Post'}
                    </button>
                </div>

                {/* Posts grouped by interest */}
                {Object.keys(postsByInterest).length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                        No posts yet. Add your first post above.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {Object.entries(postsByInterest).map(([interestId, group]) => (
                            <div key={interestId}>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--accent)',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '6px', height: '6px',
                                        borderRadius: '50%',
                                        background: 'var(--accent)',
                                        flexShrink: 0,
                                    }} />
                                    {group.name}
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                                        {group.posts.length} {group.posts.length === 1 ? 'post' : 'posts'}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '10px',
                                }}>
                                    {group.posts.map(post => (
                                        <div key={post.id} style={{
                                            background: 'var(--bg)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-sm)',
                                            overflow: 'hidden',
                                        }}>
                                            {/* Media */}
                                            {post.media && (
                                                <div style={{ aspectRatio: '4/3', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                                                    {post.media.type === 'video' ? (
                                                        <video
                                                            src={post.media.url}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            muted
                                                        />
                                                    ) : (
                                                        <img
                                                            src={post.media.url}
                                                            alt={post.caption ?? ''}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ padding: '10px' }}>
                                                {post.caption && (
                                                    <p style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        marginBottom: '6px',
                                                        lineHeight: 1.4,
                                                        overflow: 'hidden',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                    }}>
                                                        {post.caption}
                                                    </p>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        ♥ {post._count.likes}
                                                    </span>
                                                    <button
                                                        onClick={() => deletePost(post.id)}
                                                        style={{ ...ghostBtn, color: 'var(--red)', fontSize: '11px' }}
                                                        title="Delete post"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ── SECTION 4: Stats ── */}
            <Section title="Stats">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[
                        { label: 'Matches', value: stats.matches, color: 'var(--accent)' },
                        { label: 'Post Likes', value: stats.postLikes, color: 'var(--gold)' },
                        { label: 'Messages Sent', value: stats.messagesSent, color: 'var(--green)' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{
                            padding: '16px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {value}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}

// ─── Shared inline styles ─────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    display: 'block',
};

const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 10px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
};

const primaryBtn: React.CSSProperties = {
    padding: '9px 18px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s ease',
    flexShrink: 0,
};

const ghostBtn: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 'var(--radius-xs)',
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
};
