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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Sync auth token strictly across storage modes
            localStorage.setItem('tribe_jwt', data.token);
            document.cookie = `tribe_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;

            console.log('Login response:', res.status);
            console.log('Redirecting to feed');

            // Redirect instantly
            window.location.href = '/feed';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg)', padding: '20px'
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '48px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', maxWidth: '400px', width: '100%',
                boxShadow: 'var(--shadow)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                        Welcome back
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
                        Log in to reconnect with your Tribe
                    </div>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{
                            padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
                        style={{
                            padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '15px', outline: 'none',
                        }} />

                    <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
                        style={{
                            padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '15px', outline: 'none',
                        }} />

                    <button type="submit" disabled={loading} style={{
                        marginTop: '8px', padding: '16px', borderRadius: '100px', background: 'var(--accent)',
                        color: '#fff', fontSize: '16px', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1, transition: 'var(--transition)'
                    }}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
}
