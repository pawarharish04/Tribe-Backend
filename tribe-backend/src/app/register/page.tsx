'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [availableInterests, setAvailableInterests] = useState<{ id: string; name: string }[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/interests')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setAvailableInterests(data); })
            .catch(() => {});
    }, []);

    const toggleInterest = (name: string) => {
        setSelectedInterests(prev =>
            prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
        );
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (selectedInterests.length < 3) {
            setError('Please select at least 3 interests to structure your discovery feed.');
            return;
        }
        setLoading(true);
        try {
            let latitude = 37.7749;
            let longitude = -122.4194;
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
                );
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
            } catch {}

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, latitude, longitude, interests: selectedInterests }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            localStorage.setItem('tribe_jwt', data.token);
            document.cookie = `tribe_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
            window.location.href = '/feed';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        width: '100%',
        padding: '14px 16px',
        borderRadius: '12px',
        border: `1px solid ${focusedField === field ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.10)'}`,
        background: focusedField === field ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.04)',
        color: '#f8fafc',
        fontSize: '15px',
        fontFamily: 'Inter, sans-serif',
        outline: 'none',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: focusedField === field ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none',
    });

    const progressPct = Math.min(100, (selectedInterests.length / 5) * 100);
    const meetsMin = selectedInterests.length >= 3;

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0f', position: 'relative', overflow: 'hidden', padding: '20px',
        }}>
            {/* Aurora */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.20) 0%,transparent 70%)', top: '-250px', right: '-150px', animation: 'aurora 14s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.16) 0%,transparent 70%)', bottom: '-100px', left: '-100px', animation: 'aurora 18s ease-in-out infinite reverse' }} />
                <div style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(20,184,166,0.10) 0%,transparent 70%)', top: '40%', left: '30%', animation: 'aurora 22s ease-in-out infinite 3s' }} />
            </div>

            {/* Card */}
            <div style={{
                position: 'relative', zIndex: 1,
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px',
                padding: '48px 40px',
                width: '100%', maxWidth: '480px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                animation: 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
                {/* Logo + Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '52px', height: '52px', borderRadius: '15px',
                        background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                        boxShadow: '0 0 32px rgba(139,92,246,0.5)',
                        marginBottom: '20px',
                        fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'Inter, sans-serif',
                    }}>T</div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em', color: '#f8fafc', marginBottom: '8px' }}>
                        Join the Tribe
                    </h1>
                    <p style={{ fontSize: '14px', color: 'rgba(248,250,252,0.50)', fontFamily: 'Inter, sans-serif' }}>
                        Create an account to start discovering
                    </p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {error && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '12px',
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)',
                            color: '#fca5a5', fontSize: '13px', fontFamily: 'Inter, sans-serif',
                            display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideUp 0.3s ease',
                        }}>
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(248,250,252,0.55)', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: '6px' }}>Full Name</label>
                        <input id="reg-name" type="text" placeholder="Your name" required value={name}
                            onChange={e => setName(e.target.value)}
                            onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                            style={inputStyle('name')} />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(248,250,252,0.55)', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: '6px' }}>Email Address</label>
                        <input id="reg-email" type="email" placeholder="you@example.com" required value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                            style={inputStyle('email')} />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(248,250,252,0.55)', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: '6px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input id="reg-password" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" required value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                                style={{ ...inputStyle('password'), paddingRight: '44px' }} />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,250,252,0.40)', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                                {showPass ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    {/* Interest Selection */}
                    <div style={{ marginTop: '8px' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(248,250,252,0.55)', fontFamily: 'Inter, sans-serif' }}>
                                Your Interests
                            </label>
                            <span style={{
                                fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                                color: meetsMin ? '#10b981' : 'rgba(248,250,252,0.38)',
                                padding: '3px 10px', borderRadius: '999px',
                                background: meetsMin ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${meetsMin ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.10)'}`,
                                transition: 'all 0.3s',
                            }}>
                                {selectedInterests.length} / 3+ selected
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '14px' }}>
                            <div style={{
                                height: '100%', borderRadius: '2px',
                                width: `${progressPct}%`,
                                background: meetsMin ? 'linear-gradient(90deg,#8b5cf6,#10b981)' : 'linear-gradient(90deg,#8b5cf6,#ec4899)',
                                transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
                            }} />
                        </div>

                        {/* Interest pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                            {availableInterests.length > 0 ? availableInterests.map(interest => {
                                const isSelected = selectedInterests.includes(interest.name);
                                return (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.name)}
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '999px',
                                            fontSize: '13px', fontWeight: 500,
                                            fontFamily: 'Inter, sans-serif',
                                            border: `1px solid ${isSelected ? 'rgba(139,92,246,0.60)' : 'rgba(255,255,255,0.12)'}`,
                                            background: isSelected ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                                            color: isSelected ? '#a78bfa' : 'rgba(248,250,252,0.55)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: isSelected ? '0 0 10px rgba(139,92,246,0.25)' : 'none',
                                        }}
                                    >
                                        {isSelected && '✦ '}{interest.name}
                                    </button>
                                );
                            }) : (
                                <div style={{ fontSize: '13px', color: 'rgba(248,250,252,0.35)', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                    Loading interests…
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        id="reg-submit"
                        disabled={loading}
                        style={{
                            marginTop: '12px',
                            padding: '15px',
                            borderRadius: '12px',
                            background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                            color: '#fff',
                            fontSize: '15px', fontWeight: 700,
                            fontFamily: 'Inter, sans-serif',
                            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                            boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.35)',
                            letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={e => { if (!loading) (e.currentTarget).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                Creating account…
                            </span>
                        ) : 'Create Account'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,250,252,0.25)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                        Location access may be requested to establish proximity matching.
                    </p>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(248,250,252,0.40)', fontFamily: 'Inter, sans-serif' }}>Already have an account? </span>
                    <Link href="/login" style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
