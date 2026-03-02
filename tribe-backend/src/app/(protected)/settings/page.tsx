'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [jwt, setJwt] = useState('');
    const [distanceVisibility, setDistanceVisibility] = useState(true);
    const [activityVisibility, setActivityVisibility] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) {
            router.push('/login');
            return;
        }
        setJwt(stored);

        fetch('/api/settings', {
            headers: { Authorization: `Bearer ${stored}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setDistanceVisibility(data.settings.distanceVisibility);
                    setActivityVisibility(data.settings.activityVisibility);
                }
            })
            .catch(() => setError('Failed to load settings.'))
            .finally(() => setLoading(false));
    }, [router]);

    const handleSaveSettings = async () => {
        setError('');
        setMessage('');

        if (password && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({
                    distanceVisibility,
                    activityVisibility,
                    ...(password ? { password } : {})
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message || 'Settings saved successfully');
                setPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || 'Failed to save settings');
            }
        } catch (e) {
            setError('Network error saving settings');
        } finally {
            setSaving(false);
            // clear success message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }

        try {
            const res = await fetch('/api/settings/account', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.ok) {
                localStorage.removeItem('tribe_jwt');
                // clear cookies just in case
                document.cookie = 'tribe_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                router.push('/login');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to delete account');
            }
        } catch (e) {
            setError('Network error deleting account');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', color: 'var(--text-muted)', fontSize: '14px' }}>
                Loading settings…
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: '40px 20px 80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
        }}>
            <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Settings
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Manage privacy and account preferences on Tribe.
                </p>
            </div>

            {error && <div style={{ padding: '12px 16px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
            {message && <div style={{ padding: '12px 16px', background: 'rgba(52, 211, 153, 0.1)', color: 'rgb(52, 211, 153)', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}>{message}</div>}

            {/* ── Privacy ── */}
            <section style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}>
                <h2 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Privacy
                </h2>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={distanceVisibility}
                        onChange={e => setDistanceVisibility(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', marginTop: '2px' }}
                    />
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>Distance Visibility</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                            Let others see your location distance if they appear in your feed. When disabled, your location is hidden.
                        </div>
                    </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginTop: '8px' }}>
                    <input
                        type="checkbox"
                        checked={activityVisibility}
                        onChange={e => setActivityVisibility(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', marginTop: '2px' }}
                    />
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>Activity Visibility</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                            Show your last active timestamp to your matches.
                        </div>
                    </div>
                </label>
            </section>

            {/* ── Security ── */}
            <section style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}>
                <h2 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Security
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>Change Password</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="password"
                            placeholder="New password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                    <button onClick={handleSaveSettings} disabled={saving} style={primaryBtn}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </section>

            {/* ── Danger Zone ── */}
            <section style={{
                background: 'rgba(239, 68, 68, 0.03)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}>
                <h2 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Danger Zone
                </h2>

                <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--red)' }}>Delete Account</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                        Once you delete your account, there is no going back. All of your data, messages, and matches will be permanently deleted.
                    </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                    <button
                        onClick={handleDeleteAccount}
                        style={{
                            ...primaryBtn,
                            background: deleteConfirm ? 'var(--red)' : 'transparent',
                            color: deleteConfirm ? '#fff' : 'var(--red)',
                            border: '1px solid var(--red)',
                        }}
                    >
                        {deleteConfirm ? 'Are you absolutely sure? Click again to delete.' : 'Delete Account'}
                    </button>
                </div>
            </section>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '200px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
};

const primaryBtn: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s ease, background 0.15s ease',
};
