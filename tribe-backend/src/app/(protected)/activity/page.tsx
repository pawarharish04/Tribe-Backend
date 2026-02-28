'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ActivityLike {
    id: string;
    likerId: string;
    displayName: string | null;
    revealed: boolean;
    postCaption: string | null;
    interestName: string;
    lastActiveAt: string | null;
    createdAt: string;
}

function timeSince(dateStr: string | null) {
    if (!dateStr) return 'some time ago';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function ActivityCard({ like }: { like: ActivityLike }) {
    return (
        <div style={{
            padding: '18px 20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'var(--transition)',
        }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
            {/* Avatar */}
            <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: like.revealed ? 'var(--accent-soft)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${like.revealed ? 'rgba(124,106,247,0.3)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 600,
                color: like.revealed ? 'var(--accent)' : 'var(--text-muted)',
                letterSpacing: '-0.02em',
            }}>
                {like.revealed
                    ? (like.displayName?.charAt(0) ?? '?')
                    : '?'}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>
                        {like.displayName ?? 'Someone'}
                    </span>
                    {!like.revealed && (
                        <span style={{
                            marginLeft: '6px',
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            verticalAlign: 'middle',
                        }}>🔒</span>
                    )}
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                        {' '}liked your{' '}
                        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                            {like.interestName}
                        </span>
                        {' '}post
                    </span>
                </div>

                {like.postCaption && (
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        marginBottom: '4px',
                    }}>
                        "{like.postCaption}"
                    </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {timeSince(like.createdAt)}
                    {like.lastActiveAt && (
                        <span style={{ marginLeft: '8px', color: 'rgba(255,255,255,0.15)' }}>
                            · Active {timeSince(like.lastActiveAt)}
                        </span>
                    )}
                </div>
            </div>

            {/* CTA */}
            <Link
                href={`/profile/${like.likerId}`}
                style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    flexShrink: 0,
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    transition: 'var(--transition)',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,106,247,0.3)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                }}
            >
                View Profile →
            </Link>
        </div>
    );
}

export default function ActivityPage() {
    const router = useRouter();
    const [jwt, setJwt] = useState('');
    const [likes, setLikes] = useState<ActivityLike[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) {
            router.push('/login');
            return;
        }
        setJwt(stored);
    }, [router]);

    useEffect(() => {
        if (!jwt) return;
        setLoading(true);
        fetch('/api/post-likes', {
            headers: { Authorization: `Bearer ${jwt}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setLikes(data.likes || []);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [jwt]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>



            {/* Main */}
            <main style={{ flex: 1, maxWidth: '640px', width: '100%', margin: '0 auto', padding: '32px 20px 80px' }}>

                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Activity
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        People who engaged with your posts — soft signals, no auto-match.
                    </p>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        Loading activity...
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--red-soft)', color: 'var(--red)',
                        fontSize: '13px', marginBottom: '20px',
                    }}>
                        {error}
                    </div>
                )}

                {!loading && likes.length === 0 && !error && (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>♡</div>
                        <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                            No post likes yet
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                            When someone likes one of your interest posts,<br />they'll appear here.
                        </div>
                    </div>
                )}

                {!loading && likes.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Count bar */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            fontSize: '13px', marginBottom: '8px',
                        }}>
                            <span style={{ color: 'var(--text-muted)' }}>Total likes received</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{likes.length}</span>
                        </div>

                        {likes.map(like => <ActivityCard key={like.id} like={like} />)}
                    </div>
                )}
            </main>
        </div>
    );
}
