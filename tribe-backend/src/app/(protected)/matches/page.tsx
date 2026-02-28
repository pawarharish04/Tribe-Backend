'use client';

import { useState, useCallback, useEffect } from 'react';
import MatchList, { type MatchListItem } from '../../../components/matches/MatchList';

interface MatchPayload extends MatchListItem {
    distanceKm: number | null;
    latestPost: {
        interest: { name: string };
        media: { type: string } | null;
    } | null;
}

export default function MatchesPage() {
    const [jwt, setJwt] = useState('');
    const [matches, setMatches] = useState<MatchPayload[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (stored) {
            setJwt(stored);
        } else {
            setError('Unauthorized. Please log in.');
        }
    }, []);

    const fetchMatches = useCallback(async () => {
        if (!jwt.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/matches', {
                headers: { Authorization: `Bearer ${jwt.trim()}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Matches fetch failed');
            setMatches(data.matches || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [jwt]);

    useEffect(() => {
        if (jwt) fetchMatches();
    }, [jwt, fetchMatches]);

    return (
        <div style={{
            display: 'flex',
            height: 'calc(100vh - 56px)',   // full height below Navbar
            overflow: 'hidden',
            background: 'var(--bg)',
        }}>

            {/* ── Left sidebar ── */}
            <aside style={{
                width: '18rem',            // w-72
                flexShrink: 0,
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Sidebar header */}
                <div style={{
                    padding: '16px 16px 12px',
                    borderBottom: '1px solid var(--border)',
                    flexShrink: 0,
                }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                    }}>
                        Matches
                        {matches.length > 0 && (
                            <span style={{
                                marginLeft: '8px',
                                padding: '1px 6px',
                                borderRadius: '20px',
                                background: 'var(--accent-soft)',
                                color: 'var(--accent)',
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0',
                                textTransform: 'none',
                            }}>
                                {matches.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Sidebar body */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading && (
                        <div style={{
                            padding: '24px 16px',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            textAlign: 'center',
                        }}>
                            Loading…
                        </div>
                    )}
                    {error && (
                        <div style={{
                            margin: '12px',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--red-soft)',
                            color: 'var(--red)',
                            fontSize: '12px',
                        }}>
                            {error}
                        </div>
                    )}
                    {!loading && !error && (
                        <MatchList matches={matches} />
                    )}
                </div>
            </aside>

            {/* ── Right: empty state ── */}
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                flexDirection: 'column',
                gap: '12px',
                userSelect: 'none',
            }}>
                <div style={{ fontSize: '40px' }}>💬</div>
                <div style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                }}>
                    Select a match to start chatting
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, textAlign: 'center', maxWidth: '240px' }}>
                    Conversations are only possible between mutual matches.
                </div>
            </main>
        </div>
    );
}
