'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileEditor, { type ProfileData, type Stats } from '../../../components/profile/ProfileEditor';

export default function MePage() {
    const router = useRouter();
    const [jwt, setJwt] = useState('');
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) {
            router.push('/login');
            return;
        }
        setJwt(stored);

        // Fetch profile data from /api/me using the JWT from localStorage
        fetch('/api/me', {
            headers: { Authorization: `Bearer ${stored}` },
        })
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (data.error) {
                    setError(data.error);
                    return;
                }
                // Normalize dates
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 56px)',
                color: 'var(--text-muted)',
                fontSize: '14px',
            }}>
                Loading profile…
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 56px)',
                flexDirection: 'column',
                gap: '12px',
                color: 'var(--red)',
                fontSize: '14px',
            }}>
                <div style={{ fontSize: '32px' }}>⚠️</div>
                {error}
            </div>
        );
    }

    if (!profile || !stats) return null;

    return <ProfileEditor profile={profile} stats={stats} jwt={jwt} />;
}
