'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [jwt, setJwt] = useState('');

    // Step 1: Interests
    const [availableInterests, setAvailableInterests] = useState<{ id: string, name: string }[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    // Step 2: Post
    const [postCaption, setPostCaption] = useState('');
    const [postInterest, setPostInterest] = useState('');

    useEffect(() => {
        const storedJwt = localStorage.getItem('tribe_jwt');
        if (!storedJwt) {
            router.push('/login');
        } else {
            setJwt(storedJwt);
        }

        fetch('/api/interests')
            .then(res => res.json())
            .then(data => Array.isArray(data) && setAvailableInterests(data))
            .catch(() => { });
    }, [router]);

    const handleInterestToggle = (name: string) => {
        if (selectedInterests.includes(name)) {
            setSelectedInterests(prev => prev.filter(i => i !== name));
        } else {
            setSelectedInterests(prev => [...prev, name]);
        }
    };

    const submitInterests = async () => {
        if (selectedInterests.length < 3) return;
        setLoading(true);
        try {
            // Send mapping sequence sequentially. For deep hierarchies, we'd batch this.
            for (const interest of selectedInterests) {
                await fetch('/api/interests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                    body: JSON.stringify({ name: interest, level: 1 })
                });
            }
            setStep(2);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const submitPost = async () => {
        if (!postCaption.trim() || !postInterest) return;
        setLoading(true);
        try {
            await fetch('/api/interest-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ content: postCaption, interestName: postInterest })
            });
            // Finalize Onboarding -> Feed
            router.push('/feed');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxWidth: '440px', width: '100%', boxShadow: 'var(--shadow)' }}>

                {/* Step Indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                    <div style={{ width: '32px', height: '4px', borderRadius: '2px', background: step >= 1 ? 'var(--accent)' : 'var(--border)' }} />
                    <div style={{ width: '32px', height: '4px', borderRadius: '2px', background: step >= 2 ? 'var(--accent)' : 'var(--border)' }} />
                </div>

                {step === 1 && (
                    <div style={{ animation: 'fade-in 0.4s ease' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', textAlign: 'center' }}>What are you exploring?</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>Choose at least 3 interests to anchor your discovery network.</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px', maxHeight: '200px', overflowY: 'auto' }}>
                            {availableInterests.map(interest => (
                                <button
                                    key={interest.id}
                                    onClick={() => handleInterestToggle(interest.name)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
                                        border: `1px solid ${selectedInterests.includes(interest.name) ? 'var(--accent)' : 'var(--border)'}`,
                                        background: selectedInterests.includes(interest.name) ? 'var(--accent-soft)' : 'rgba(255,255,255,0.02)',
                                        color: selectedInterests.includes(interest.name) ? 'var(--accent)' : 'var(--text-secondary)',
                                        cursor: 'pointer', transition: 'var(--transition)'
                                    }}
                                >
                                    {interest.name}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={submitInterests}
                            disabled={selectedInterests.length < 3 || loading}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '100px', background: 'var(--accent)', color: '#fff',
                                fontSize: '15px', fontWeight: 600, border: 'none', opacity: (selectedInterests.length < 3 || loading) ? 0.5 : 1,
                                cursor: (selectedInterests.length < 3 || loading) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Saving...' : `Continue (${selectedInterests.length}/3)`}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ animation: 'fade-in 0.4s ease' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', textAlign: 'center' }}>Express yourself.</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>Add a single thought, idea, or proof of interest to unlock profiles.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            <select
                                value={postInterest}
                                onChange={e => setPostInterest(e.target.value)}
                                style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '14px', outline: 'none' }}
                            >
                                <option value="" disabled hidden>Select an interest...</option>
                                {selectedInterests.map(i => <option key={i} value={i} style={{ background: '#111' }}>{i}</option>)}
                            </select>

                            <textarea
                                placeholder="What's your hot take on this?"
                                value={postCaption}
                                onChange={e => setPostCaption(e.target.value)}
                                rows={3}
                                style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                            />
                        </div>

                        <button
                            onClick={submitPost}
                            disabled={!postCaption.trim() || !postInterest || loading}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '100px', background: 'var(--accent)', color: '#fff',
                                fontSize: '15px', fontWeight: 600, border: 'none', opacity: (!postCaption.trim() || !postInterest || loading) ? 0.5 : 1,
                                cursor: (!postCaption.trim() || !postInterest || loading) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Publishing...' : 'Complete & Discover'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
