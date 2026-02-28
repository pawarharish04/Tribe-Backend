'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // Interest tracking
    const [availableInterests, setAvailableInterests] = useState<{ id: string, name: string }[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch trending foundation interests
    useEffect(() => {
        fetch('/api/interests')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAvailableInterests(data);
                }
            })
            .catch(() => console.error("Could not load initial interests."));
    }, []);

    const toggleInterest = (interestName: string) => {
        if (selectedInterests.includes(interestName)) {
            setSelectedInterests(prev => prev.filter(i => i !== interestName));
        } else {
            setSelectedInterests(prev => [...prev, interestName]);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedInterests.length < 3) {
            setError('Please select at least 3 distinct interests to structure your network.');
            return;
        }

        setLoading(true);

        try {
            // Attempt to grab live coordinates naturally
            let latitude = 37.7749; // Default San Francisco
            let longitude = -122.4194;

            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
                });
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
            } catch (err) {
                console.warn("Geolocation blocked/timed out, using default origin coordinates.");
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    latitude,
                    longitude,
                    interests: selectedInterests // Transmitting selection directly to resolver
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Sync auth token strictly across storage modes
            localStorage.setItem('tribe_jwt', data.token);
            document.cookie = `tribe_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;

            // Redirect instantly
            router.push('/feed');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
            background: 'var(--bg)', padding: '20px'
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '48px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', maxWidth: '500px', width: '100%',
                boxShadow: 'var(--shadow)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                        Join the Tribe
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
                        Create an account to start discovering
                    </div>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {error && (
                        <div style={{
                            padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
                        style={{
                            padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '15px', outline: 'none',
                        }} />

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

                    {/* Interest Gateway Block */}
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Select Your Interests</span>
                            <span style={{ color: selectedInterests.length >= 3 ? 'var(--green)' : 'var(--text-muted)' }}>
                                {selectedInterests.length}/3 Required
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
                            {availableInterests.length > 0 ? availableInterests.map(interest => {
                                const isSelected = selectedInterests.includes(interest.name);
                                return (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.name)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '100px',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                            background: isSelected ? 'var(--accent-soft)' : 'rgba(255,255,255,0.02)',
                                            color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transition: 'var(--transition)'
                                        }}
                                    >
                                        {interest.name}
                                    </button>
                                );
                            }) : (
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading network traits...</div>
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        marginTop: '12px', padding: '16px', borderRadius: '100px', background: 'var(--accent)',
                        color: '#fff', fontSize: '16px', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1, transition: 'var(--transition)'
                    }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                        Location access is requested on creation to establish routing proximity.
                    </div>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Already have an account? <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
                </div>
            </div>
        </div>
    );
}
