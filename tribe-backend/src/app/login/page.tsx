'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
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

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0f', position: 'relative', overflow: 'hidden', padding: '20px',
        }}>
            {/* Aurora background */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)',
                    top: '-200px', left: '-100px',
                    animation: 'aurora 12s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)',
                    bottom: '-150px', right: '-100px',
                    animation: 'aurora 15s ease-in-out infinite reverse',
                }} />
                <div style={{
                    position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)',
                    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    animation: 'aurora 18s ease-in-out infinite 2s',
                }} />
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
                width: '100%', maxWidth: '420px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                animation: 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '52px', height: '52px', borderRadius: '15px',
                        background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                        boxShadow: '0 0 32px rgba(139,92,246,0.5)',
                        marginBottom: '20px',
                        fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'Inter, sans-serif',
                    }}>T</div>

                    <h1 style={{
                        fontSize: '26px', fontWeight: 800, fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.03em', color: '#f8fafc',
                        marginBottom: '8px',
                    }}>
                        Welcome back
                    </h1>
                    <p style={{
                        fontSize: '14px', color: 'rgba(248,250,252,0.50)',
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        Log in to reconnect with your Tribe
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {error && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '12px',
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.30)',
                            color: '#fca5a5',
                            fontSize: '13px', fontFamily: 'Inter, sans-serif',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            animation: 'slideUp 0.3s ease',
                        }}>
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(248,250,252,0.55)', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: '6px' }}>
                            Email address
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            style={inputStyle('email')}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(248,250,252,0.55)', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: '6px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                style={{ ...inputStyle('password'), paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={{
                                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(248,250,252,0.40)', fontSize: '12px', fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {showPass ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        id="login-submit"
                        disabled={loading}
                        style={{
                            marginTop: '8px',
                            padding: '15px',
                            borderRadius: '12px',
                            background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                            color: '#fff',
                            fontSize: '15px', fontWeight: 700,
                            fontFamily: 'Inter, sans-serif',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
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
                                Signing in…
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(248,250,252,0.40)', fontFamily: 'Inter, sans-serif' }}>
                        Don't have an account?{' '}
                    </span>
                    <Link href="/register" style={{
                        fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                        background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', textDecoration: 'none',
                    }}>
                        Join Tribe
                    </Link>
                </div>
            </div>
        </div>
    );
}
