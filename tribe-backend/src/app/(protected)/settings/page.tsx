'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '../../../design/tokens';

const inputStyle: React.CSSProperties = {
    flex: 1, minWidth: '200px',
    background: 'white',
    border: `1px solid ${T.sep}`,
    borderRadius: '8px',
    padding: '10px 14px',
    color: T.ink,
    fontSize: '14px',
    fontFamily: "'Cormorant Garamond',Georgia,serif",
    outline: 'none',
    transition: 'border-color 0.15s',
};

const section: React.CSSProperties = {
    background: 'white',
    border: `1px solid ${T.sep}`,
    borderRadius: '14px',
    padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    boxShadow: '0 1px 4px rgba(28,25,23,0.05)',
};

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
        if (!stored) { router.push('/login'); return; }
        setJwt(stored);
        fetch('/api/settings', { headers: { Authorization: `Bearer ${stored}` } })
            .then(r => r.json())
            .then(d => { if (d.settings) { setDistanceVisibility(d.settings.distanceVisibility); setActivityVisibility(d.settings.activityVisibility); } })
            .catch(() => setError('Failed to load settings.'))
            .finally(() => setLoading(false));
    }, [router]);

    const handleSave = async () => {
        setError(''); setMessage('');
        if (password && password !== confirmPassword) { setError('Passwords do not match'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ distanceVisibility, activityVisibility, ...(password ? { password } : {}) }),
            });
            const d = await res.json();
            if (res.ok) { setMessage(d.message || 'Settings saved successfully'); setPassword(''); setConfirmPassword(''); }
            else setError(d.error || 'Failed to save settings');
        } catch { setError('Network error'); }
        finally { setSaving(false); setTimeout(() => setMessage(''), 3000); }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) { setDeleteConfirm(true); return; }
        try {
            const res = await fetch('/api/settings/account', { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
            if (res.ok) { localStorage.removeItem('tribe_jwt'); document.cookie = 'tribe_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'; router.push('/login'); }
            else { const d = await res.json(); setError(d.error || 'Failed to delete account'); }
        } catch { setError('Network error'); }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', color: T.inkFaint, fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', background: T.cream }}>
            Loading settings…
        </div>
    );

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '44px 20px 80px', display: 'flex', flexDirection: 'column', gap: '28px', background: T.cream, minHeight: 'calc(100vh - 56px)' }}>

            {/* Page header */}
            <div style={{ borderBottom: `1px solid ${T.sep}`, paddingBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.ink, letterSpacing: '-0.03em', marginBottom: '6px' }}>Settings</h1>
                <p style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, lineHeight: 1.6 }}>Manage privacy and account preferences.</p>
            </div>

            {error && <div style={{ padding: '11px 16px', background: T.claySoft, color: T.clay, fontSize: '13px', borderRadius: '8px', border: `1px solid ${T.clay}35`, fontFamily: 'Georgia,serif' }}>{error}</div>}
            {message && <div style={{ padding: '11px 16px', background: T.sageSoft, color: T.sage, fontSize: '13px', borderRadius: '8px', border: `1px solid ${T.sage}35`, fontFamily: 'Georgia,serif' }}>{message}</div>}

            {/* Privacy */}
            <section style={section}>
                <h2 style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: 'Georgia,serif' }}>Privacy</h2>

                {[
                    { label: 'Distance Visibility', info: 'Let others see your location distance. When disabled, your location is hidden.', val: distanceVisibility, set: setDistanceVisibility },
                    { label: 'Activity Visibility', info: 'Show your last active timestamp to your matches.', val: activityVisibility, set: setActivityVisibility },
                ].map(({ label, info, val, set }) => (
                    <label key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ width: '17px', height: '17px', accentColor: T.sage, marginTop: '3px' }} />
                        <div>
                            <div style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.ink, fontWeight: 600 }}>{label}</div>
                            <div style={{ fontSize: '12px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, marginTop: '3px', lineHeight: 1.55 }}>{info}</div>
                        </div>
                    </label>
                ))}
            </section>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right,${T.sep},transparent)` }} />
                <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: 'Georgia,serif' }}>Security</span>
                <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left,${T.sep},transparent)` }} />
            </div>

            {/* Security */}
            <section style={section}>
                <h2 style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: 'Georgia,serif' }}>Change Password</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} onFocus={e => (e.target as HTMLElement).style.borderColor = T.sage} onBlur={e => (e.target as HTMLElement).style.borderColor = T.sep} />
                    <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} onFocus={e => (e.target as HTMLElement).style.borderColor = T.sage} onBlur={e => (e.target as HTMLElement).style.borderColor = T.sep} />
                </div>
                <div>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: '8px', background: T.ink, color: T.cream, border: 'none', fontSize: '13px', fontFamily: 'Georgia,serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </section>

            {/* Danger zone */}
            <section style={{ ...section, background: T.claySoft, border: `1px solid ${T.clay}40` }}>
                <h2 style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.clay, fontFamily: 'Georgia,serif' }}>Danger Zone</h2>
                <div>
                    <div style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.clay, fontWeight: 600 }}>Delete Account</div>
                    <div style={{ fontSize: '12px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, marginTop: '4px', lineHeight: 1.55 }}>
                        Once deleted, all your data, messages, and matches are permanently gone.
                    </div>
                </div>
                <button onClick={handleDelete} style={{
                    alignSelf: 'flex-start', padding: '9px 22px', borderRadius: '8px',
                    background: deleteConfirm ? T.clay : 'transparent',
                    color: deleteConfirm ? T.cream : T.clay,
                    border: `1.5px solid ${T.clay}`,
                    fontSize: '13px', fontFamily: 'Georgia,serif',
                    cursor: 'pointer', transition: 'all 0.18s',
                }}>
                    {deleteConfirm ? 'Are you sure? Click again to confirm.' : 'Delete Account'}
                </button>
            </section>
        </div>
    );
}
