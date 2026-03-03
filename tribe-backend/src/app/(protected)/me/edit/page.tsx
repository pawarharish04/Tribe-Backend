'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileEditor, { type ProfileData, type Stats } from '../../../../components/profile/ProfileEditor';

export default function ProfileEditPage() {
    const router = useRouter();
    const [jwt, setJwt] = useState('');
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) { router.push('/login'); return; }
        setJwt(stored);

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

    if (loading) return <PageCenter><span style={{ color: 'var(--text-muted)' }}>Loading…</span></PageCenter>;
    if (error) return <PageCenter><span style={{ color: 'var(--red)' }}>⚠️ {error}</span></PageCenter>;
    if (!profile || !stats) return null;

    return <ProfileEditor profile={profile} stats={stats} jwt={jwt} />;
}

function PageCenter({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: '12px',
        }}>
            {children}
        </div>
    );
}
