'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface MatchItem {
    id: string;
    matchId: string;
    name: string | null;
    avatarUrl: string | null;
    distanceKm: number | null;
    lastActiveAt?: string;
    latestPost?: { interest: { name: string }; media: { type: string } | null } | null;
}

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
}

function timeSince(d: string) {
    const ms = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

// ── Avatar component ──────────────────────────────────────────────────────────
function Avatar({ name, avatarUrl, size = 44, active = false }: { name: string | null; avatarUrl: string | null; size?: number; active?: boolean }) {
    const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                padding: '2px',
                boxShadow: active ? '0 0 16px rgba(139,92,246,0.5)' : 'none',
            }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#13131e' }}>
                    {avatarUrl
                        ? <img src={avatarUrl} alt={name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, fontFamily: 'Inter,sans-serif', color: '#a78bfa' }}>{initials}</div>
                    }
                </div>
            </div>
            {active && (
                <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #0a0a0f' }} />
            )}
        </div>
    );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
            <div style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(255,255,255,0.08)',
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.10)',
                color: '#f8fafc',
                fontSize: '14px', fontFamily: 'Inter,sans-serif', lineHeight: 1.5,
                boxShadow: isMine ? '0 4px 16px rgba(139,92,246,0.3)' : 'none',
            }}>
                {msg.content}
                <div style={{ fontSize: '10px', color: isMine ? 'rgba(255,255,255,0.6)' : 'rgba(248,250,252,0.35)', marginTop: '4px', textAlign: isMine ? 'right' : 'left' }}>
                    {timeSince(msg.createdAt)}
                </div>
            </div>
        </div>
    );
}

// ── Match list item ───────────────────────────────────────────────────────────
function MatchListItem({ match, isActive, onClick }: { match: MatchItem; isActive: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
            border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            transition: 'background 0.2s', textAlign: 'left',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget).style.background = 'transparent'; }}
        >
            <Avatar name={match.name} avatarUrl={match.avatarUrl} size={42} active />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter,sans-serif', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {match.name ?? 'Unknown'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(248,250,252,0.40)', fontFamily: 'Inter,sans-serif', marginTop: '2px' }}>
                    {match.latestPost?.interest.name ?? 'Tap to message'}
                </div>
            </div>
            {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', flexShrink: 0 }} />}
        </button>
    );
}

// ── Chat Thread ───────────────────────────────────────────────────────────────
function ChatThread({ match, myId, jwt }: { match: MatchItem; myId: string; jwt: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`/api/matches/${match.matchId}/messages`, { headers: { Authorization: `Bearer ${jwt}` } })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.messages) setMessages(d.messages); })
            .catch(() => {});
    }, [match.matchId, jwt]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMsg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        const optimistic: Message = { id: `tmp-${Date.now()}`, senderId: myId, content: text.trim(), createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, optimistic]);
        setText('');
        try {
            const res = await fetch(`/api/matches/${match.matchId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ content: optimistic.content }),
            });
            if (res.ok) {
                const d = await res.json();
                setMessages(prev => prev.map(m => m.id === optimistic.id ? (d.message || m) : m));
            }
        } catch {}
        finally { setSending(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.03)',
                flexShrink: 0,
            }}>
                <Avatar name={match.name} avatarUrl={match.avatarUrl} size={40} active />
                <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>{match.name ?? 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        Active now
                    </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <a href={`/profile/${match.id}`} style={{
                        padding: '7px 14px', borderRadius: '999px',
                        background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.30)',
                        color: '#a78bfa', fontSize: '12px', fontFamily: 'Inter,sans-serif', textDecoration: 'none',
                    }}>
                        View Profile
                    </a>
                </div>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(248,250,252,0.30)', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                        Say hello to {match.name?.split(' ')[0] ?? 'them'}!
                    </div>
                )}
                {messages.map(msg => (
                    <ChatBubble key={msg.id} msg={msg} isMine={msg.senderId === myId} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={sendMsg} style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', gap: '10px', alignItems: 'center',
                background: 'rgba(255,255,255,0.03)',
                flexShrink: 0,
            }}>
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={`Message ${match.name?.split(' ')[0] ?? ''}…`}
                    style={{
                        flex: 1, padding: '11px 16px', borderRadius: '999px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                        color: '#f8fafc', fontSize: '14px', fontFamily: 'Inter,sans-serif', outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                />
                <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                        background: text.trim() ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(255,255,255,0.08)',
                        border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', transition: 'all 0.2s',
                        boxShadow: text.trim() ? '0 4px 12px rgba(139,92,246,0.35)' : 'none',
                    }}
                >
                    {sending ? '…' : '↑'}
                </button>
            </form>
        </div>
    );
}

// ── Empty thread state ────────────────────────────────────────────────────────
function SelectMatchPrompt() {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'rgba(248,250,252,0.30)', padding: '40px' }}>
            <div style={{ fontSize: '48px', animation: 'float 4s ease-in-out infinite' }}>💌</div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Inter,sans-serif', color: 'rgba(248,250,252,0.60)', marginBottom: '8px' }}>Select a match</div>
                <div style={{ fontSize: '13px', fontFamily: 'Inter,sans-serif', lineHeight: 1.6, maxWidth: '260px' }}>
                    Conversations are only possible between mutual matches.
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MatchesPage() {
    const [jwt, setJwt] = useState('');
    const [myId, setMyId] = useState('');
    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeMatch, setActiveMatch] = useState<MatchItem | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) { setError('Please log in'); setLoading(false); return; }
        setJwt(stored);

        // Fetch matches + current user id in parallel
        Promise.all([
            fetch('/api/matches', { headers: { Authorization: `Bearer ${stored}` } }).then(r => r.ok ? r.json() : null),
            fetch('/api/me', { headers: { Authorization: `Bearer ${stored}` } }).then(r => r.ok ? r.json() : null),
        ]).then(([matchData, meData]) => {
            if (matchData?.matches) setMatches(matchData.matches);
            if (meData?.user?.id) setMyId(meData.user.id);
        }).catch(() => setError('Failed to load.')).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{
            height: 'calc(100vh - 72px)',
            display: 'flex',
            background: '#0a0a0f',
            overflow: 'hidden',
        }}>
            {/* ── Sidebar ── */}
            <aside style={{
                width: '280px', flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
            }}>
                {/* Header */}
                <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Inter,sans-serif', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', flex: 1 }}>
                            Matches
                        </h1>
                        {matches.length > 0 && (
                            <span style={{ padding: '2px 8px', borderRadius: '999px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.30)', color: '#a78bfa', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>
                                {matches.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Match list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading && (
                        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.10)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: '13px', color: 'rgba(248,250,252,0.30)', fontFamily: 'Inter,sans-serif' }}>Loading matches…</div>
                        </div>
                    )}
                    {error && (
                        <div style={{ margin: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', color: '#fca5a5', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}>{error}</div>
                    )}
                    {!loading && !error && matches.length === 0 && (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(248,250,252,0.30)', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💫</div>
                            Start liking people to get matches!
                        </div>
                    )}
                    {matches.map(m => (
                        <MatchListItem key={m.id} match={m} isActive={activeMatch?.id === m.id} onClick={() => setActiveMatch(m)} />
                    ))}
                </div>
            </aside>

            {/* ── Main area ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {activeMatch && jwt && myId
                    ? <ChatThread key={activeMatch.matchId} match={activeMatch} myId={myId} jwt={jwt} />
                    : <SelectMatchPrompt />
                }
            </main>
        </div>
    );
}
