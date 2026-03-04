'use client';

import { useState, useCallback, useEffect } from 'react';
import MatchList, { type MatchListItem } from '../../../components/matches/MatchList';
import { T } from '../../../design/tokens';

interface MatchPayload extends MatchListItem {
    distanceKm: number | null;
    latestPost: { interest: { name: string }; media: { type: string } | null } | null;
}

export default function MatchesPage() {
    const [jwt, setJwt] = useState('');
    const [matches, setMatches] = useState<MatchPayload[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (stored) setJwt(stored);
        else setError('Unauthorized. Please log in.');
    }, []);

    const fetchMatches = useCallback(async () => {
        if (!jwt.trim()) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/matches', { headers: { Authorization: `Bearer ${jwt.trim()}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Matches fetch failed');
            setMatches(data.matches || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [jwt]);

    useEffect(() => { if (jwt) fetchMatches(); }, [jwt, fetchMatches]);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: T.cream }}>

            {/* ── Left sidebar ── */}
            <aside style={{ width: '17rem', flexShrink: 0, borderRight: `1px solid ${T.sep}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.cream2 }}>
                {/* Header */}
                <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${T.sep}`, flexShrink: 0 }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: 'Georgia,serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Matches
                        {matches.length > 0 && (
                            <span style={{ padding: '1px 7px', borderRadius: '20px', background: T.sageSoft, color: T.sage, fontSize: '9px', letterSpacing: '0', textTransform: 'none', border: `1px solid ${T.sage}35` }}>
                                {matches.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading && <div style={{ padding: '24px 16px', color: T.inkFaint, fontSize: '13px', textAlign: 'center', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic' }}>Loading…</div>}
                    {error && <div style={{ margin: '12px', padding: '10px 12px', borderRadius: '8px', background: T.claySoft, color: T.clay, fontSize: '12px', fontFamily: 'Georgia,serif' }}>{error}</div>}
                    {!loading && !error && <MatchList matches={matches} />}
                </div>
            </aside>

            {/* ── Right: empty state ── */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkFaint, flexDirection: 'column', gap: '12px', userSelect: 'none', background: T.cream }}>
                <div style={{ fontSize: '28px', opacity: 0.35 }}>◎</div>
                <div style={{ fontSize: '16px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', color: T.inkLight }}>Select a match to begin</div>
                <div style={{ fontSize: '13px', fontFamily: "'Cormorant Garamond',Georgia,serif", lineHeight: 1.6, textAlign: 'center', maxWidth: '240px', color: T.inkFaint }}>
                    Conversations are only possible between mutual matches.
                </div>
            </main>
        </div>
    );
}
