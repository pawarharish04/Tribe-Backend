'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PillSwitch from '../../../components/ui/PillSwitch';

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
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) { router.push('/login'); return; }
        setJwt(stored);
        fetch('/api/settings', { headers: { Authorization: `Bearer ${stored}` } })
            .then(r => r.json())
            .then(d => {
                if (d.settings) {
                    setDistanceVisibility(d.settings.distanceVisibility);
                    setActivityVisibility(d.settings.activityVisibility);
                }
            })
            .catch(() => setError('Failed to load settings.'))
            .finally(() => setLoading(false));
    }, [router]);

    const handleSave = async () => {
        setError(''); setMessage('');
        if (password && password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ distanceVisibility, activityVisibility, ...(password ? { password } : {}) }),
            });
            const d = await res.json();
            if (res.ok) { setMessage(d.message || 'Settings saved successfully'); setPassword(''); setConfirmPassword(''); }
            else setError(d.error || 'Failed to save settings.');
        } catch { setError('Network error. Please try again.'); }
        finally { setSaving(false); setTimeout(() => setMessage(''), 4000); }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) { setDeleteConfirm(true); return; }
        try {
            const res = await fetch('/api/settings/account', { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
            if (res.ok) {
                localStorage.removeItem('tribe_jwt');
                document.cookie = 'tribe_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                router.push('/login');
            } else {
                const d = await res.json();
                setError(d.error || 'Failed to delete account.');
            }
        } catch { setError('Network error.'); }
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        width: '100%', padding: '13px 16px', borderRadius: '12px',
        border: `1px solid ${focusedField === field ? 'rgba(139,92,246,0.60)' : 'rgba(255,255,255,0.10)'}`,
        background: focusedField === field ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.04)',
        color: '#f8fafc', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none',
        transition: 'all 0.25s',
        boxShadow: focusedField === field ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none',
    });

    const SectionCard = ({ children, danger }: { children: React.ReactNode; danger?: boolean }) => (
        <div style={{
            background: danger ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${danger ? 'rgba(239,68,68,0.20)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '16px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
            {children}
        </div>
    );

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', gap: '12px' }}>
            <div style={{ width: '22px', height: '22px', border: '2.5px solid rgba(255,255,255,0.10)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: '14px', color: 'rgba(248,250,252,0.38)', fontFamily: 'Inter,sans-serif' }}>Loading settings…</span>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, sans-serif', color: '#f8fafc' }}>

            {/* Page header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 50,
                padding: '16px 20px', background: 'rgba(10,10,15,0.85)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <h1 style={{
                    fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Settings</h1>
            </div>

            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 20px 60px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Toast states */}
                {error && (
                    <div style={{ padding: '13px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideUp 0.3s ease' }}>
                        <span>⚠</span> {error}
                    </div>
                )}
                {message && (
                    <div style={{ padding: '13px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideUp 0.3s ease' }}>
                        <span>✓</span> {message}
                    </div>
                )}

                {/* ── Privacy ── */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }} />
                        <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.50)' }}>Privacy</h2>
                    </div>
                    <SectionCard>
                        <PillSwitch
                            id="distance-vis"
                            checked={distanceVisibility}
                            onChange={setDistanceVisibility}
                            label="Distance Visibility"
                            description="Let others see approximately how far you are. When off, your distance is hidden from the feed."
                        />
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <PillSwitch
                            id="activity-vis"
                            checked={activityVisibility}
                            onChange={setActivityVisibility}
                            label="Activity Visibility"
                            description="Show your last active timestamp to your matches and in the discovery feed."
                        />
                    </SectionCard>
                </div>

                {/* ── Security ── */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(135deg,#14b8a6,#8b5cf6)' }} />
                        <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.50)' }}>Security</h2>
                    </div>
                    <SectionCard>
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc', display: 'block', marginBottom: '16px' }}>Change Password</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('pw')} onBlur={() => setFocusedField(null)}
                                    style={inputStyle('pw')} />
                                <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    onFocus={() => setFocusedField('cpw')} onBlur={() => setFocusedField(null)}
                                    style={inputStyle('cpw')} />
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                alignSelf: 'flex-start', padding: '11px 28px', borderRadius: '999px',
                                background: saving ? 'rgba(139,92,246,0.40)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                                color: '#fff', fontSize: '14px', fontWeight: 600, border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: saving ? 'none' : '0 4px 16px rgba(139,92,246,0.30)',
                                transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: '8px',
                            }}
                        >
                            {saving && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </SectionCard>
                </div>

                {/* ── Account / Danger ── */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'rgba(239,68,68,0.7)' }} />
                        <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(239,68,68,0.65)' }}>Danger Zone</h2>
                    </div>
                    <SectionCard danger>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fca5a5', marginBottom: '6px' }}>Delete Account</div>
                            <div style={{ fontSize: '13px', color: 'rgba(248,250,252,0.45)', lineHeight: 1.6 }}>
                                Once deleted, all your data, messages, matches, and posts are permanently removed. This action cannot be undone.
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            style={{
                                alignSelf: 'flex-start', padding: '11px 24px', borderRadius: '999px',
                                background: deleteConfirm ? '#ef4444' : 'transparent',
                                color: deleteConfirm ? '#fff' : '#f87171',
                                border: '1.5px solid rgba(239,68,68,0.50)',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.25s',
                                boxShadow: deleteConfirm ? '0 4px 16px rgba(239,68,68,0.35)' : 'none',
                            }}
                            onMouseEnter={e => { if (!deleteConfirm) (e.currentTarget).style.background = 'rgba(239,68,68,0.10)'; }}
                            onMouseLeave={e => { if (!deleteConfirm) (e.currentTarget).style.background = 'transparent'; }}
                        >
                            {deleteConfirm ? '⚠ Click again to permanently delete' : 'Delete Account'}
                        </button>
                    </SectionCard>
                </div>

                {/* Sign out shortcut */}
                <button
                    onClick={() => {
                        localStorage.removeItem('tribe_jwt');
                        document.cookie = 'tribe_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                        router.push('/login');
                    }}
                    style={{
                        padding: '12px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(248,250,252,0.45)', fontSize: '14px', fontFamily: 'Inter,sans-serif',
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget).style.color = '#f8fafc'; }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.color = 'rgba(248,250,252,0.45)'; }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
