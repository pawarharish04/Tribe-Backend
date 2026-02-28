'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

    const [jwt, setJwt] = useState('');
    const [myId, setMyId] = useState('');
    const [partnerName, setPartnerName] = useState('Match');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [initialLoad, setInitialLoad] = useState(true);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Track which message IDs have already been rendered — new ones fade in
    const seenIdsRef = useRef<Set<string>>(new Set());
    const [newIds, setNewIds] = useState<Set<string>>(new Set());

    // Auth + match metadata
    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) { router.push('/login'); return; }
        setJwt(stored);

        // Decode JWT payload to get userId (no crypto verify — just parse)
        try {
            const payload = JSON.parse(atob(stored.split('.')[1]));
            setMyId(payload.userId ?? payload.id ?? payload.sub ?? '');
        } catch { /* leave myId empty, messages still work */ }
    }, [router]);

    // Load match partner name from /matches list
    useEffect(() => {
        if (!jwt || !matchId) return;
        fetch('/api/matches', { headers: { Authorization: `Bearer ${jwt}` } })
            .then(r => r.json())
            .then(data => {
                const match = (data.matches ?? []).find((m: any) => m.matchId === matchId);
                if (match?.partnerName) setPartnerName(match.partnerName);
            })
            .catch(() => { /* soft fail — header still shows "Match" */ });
    }, [jwt, matchId]);

    const loadMessages = useCallback(async (silent = false) => {
        if (!jwt || !matchId) return;
        try {
            const res = await fetch(`/api/matches/${matchId}/messages`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            if (res.status === 403) {
                setLoadError('You are not a member of this match.');
                return;
            }
            const data = await res.json();
            const incoming: Message[] = data.messages ?? [];

            // Determine which IDs are brand new (not yet seen)
            const freshIds = new Set<string>();
            for (const msg of incoming) {
                if (!seenIdsRef.current.has(msg.id)) {
                    freshIds.add(msg.id);
                }
            }

            // Mark all incoming as seen immediately
            for (const msg of incoming) {
                seenIdsRef.current.add(msg.id);
            }

            setMessages(incoming);

            if (freshIds.size > 0) {
                setNewIds(freshIds);
                // Clear animation class after it completes so re-polls don't re-trigger
                setTimeout(() => setNewIds(new Set()), 300);
            }
        } catch {
            if (!silent) setLoadError('Failed to load messages.');
        } finally {
            setInitialLoad(false);
        }
    }, [jwt, matchId]);

    // Initial load + 6s poll
    useEffect(() => {
        if (!jwt || !matchId) return;
        loadMessages();
        intervalRef.current = setInterval(() => loadMessages(true), 6000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [jwt, matchId, loadMessages]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: messages.length <= 1 ? 'instant' : 'smooth' } as any);
    }, [messages]);

    const sendMessage = async () => {
        const content = input.trim();
        if (!content || sending || !jwt) return;

        setSending(true);
        // Optimistic insert — mark as seen immediately so it doesn't re-animate on confirm
        const optimistic: Message = {
            id: `opt-${Date.now()}`,
            senderId: myId,
            content,
            createdAt: new Date().toISOString(),
        };
        seenIdsRef.current.add(optimistic.id);
        setMessages(prev => [...prev, optimistic]);
        setInput('');

        try {
            const res = await fetch(`/api/matches/${matchId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) {
                // Revert optimistic on failure
                setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                setInput(content);
            } else {
                // Replace optimistic with real message from server
                const data = await res.json();
                setMessages(prev => prev.map(m =>
                    m.id === optimistic.id ? data.message : m
                ));
            }
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setInput(content);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Group messages by date for separators
    const grouped: { date: string; messages: Message[] }[] = [];
    for (const msg of messages) {
        const d = new Date(msg.createdAt).toDateString();
        const last = grouped[grouped.length - 1];
        if (!last || last.date !== d) {
            grouped.push({ date: d, messages: [msg] });
        } else {
            last.messages.push(msg);
        }
    }

    return (
        <>
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 100,
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(12,12,14,0.95)',
                    backdropFilter: 'blur(16px)',
                    padding: '0 20px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                }}>
                    <Link href="/matches" style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '18px',
                        lineHeight: 1,
                        flexShrink: 0,
                        padding: '4px',
                    }}>←</Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontWeight: 600,
                            fontSize: '15px',
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {partnerName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Mutual match · Tribe
                        </div>
                    </div>
                </header>

                {/* Error state */}
                {loadError && (
                    <div style={{
                        padding: '12px 20px',
                        background: 'var(--red-soft)',
                        color: 'var(--red)',
                        fontSize: '13px',
                        textAlign: 'center',
                    }}>
                        {loadError}
                    </div>
                )}

                {/* Message list */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    maxWidth: '700px',
                    width: '100%',
                    margin: '0 auto',
                }}>

                    {initialLoad && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px 0' }}>
                            Loading messages...
                        </div>
                    )}

                    {!initialLoad && messages.length === 0 && !loadError && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '14px' }}>✉️</div>
                            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Start the conversation
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                                You and {partnerName} matched.<br />Say something genuine.
                            </div>
                        </div>
                    )}

                    {grouped.map(group => (
                        <div key={group.date}>
                            {/* Date separator */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                margin: '16px 0 12px',
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                                <span style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    fontWeight: 500,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                }}>
                                    {formatDateSeparator(group.messages[0].createdAt)}
                                </span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                            </div>

                            {/* Messages in this date group */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {group.messages.map((msg, i) => {
                                    const isMine = msg.senderId === myId;
                                    const prevMsg = group.messages[i - 1];
                                    const isSameAuthor = prevMsg && prevMsg.senderId === msg.senderId;

                                    return (
                                        <div key={msg.id} style={{
                                            display: 'flex',
                                            flexDirection: isMine ? 'row-reverse' : 'row',
                                            alignItems: 'flex-end',
                                            gap: '8px',
                                            marginTop: isSameAuthor ? '0' : '8px',
                                            animation: newIds.has(msg.id) ? 'msg-enter 0.18s ease-out both' : 'none',
                                        }}>
                                            <div style={{
                                                maxWidth: '72%',
                                                padding: '10px 14px',
                                                borderRadius: isMine
                                                    ? '18px 18px 4px 18px'
                                                    : '18px 18px 18px 4px',
                                                background: isMine
                                                    ? 'var(--accent)'
                                                    : 'rgba(255,255,255,0.06)',
                                                border: isMine
                                                    ? 'none'
                                                    : '1px solid var(--border)',
                                                color: isMine ? '#fff' : 'var(--text-primary)',
                                                fontSize: '14px',
                                                lineHeight: 1.5,
                                                wordBreak: 'break-word',
                                                opacity: msg.id.startsWith('opt-') ? 0.7 : 1,
                                                transition: 'opacity 0.2s ease',
                                            }}>
                                                {msg.content}
                                                <div style={{
                                                    fontSize: '10px',
                                                    marginTop: '4px',
                                                    color: isMine ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)',
                                                    textAlign: isMine ? 'right' : 'left',
                                                }}>
                                                    {formatTime(msg.createdAt)}
                                                    {msg.id.startsWith('opt-') && ' · sending'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Scroll anchor */}
                    <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(12,12,14,0.97)',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-end',
                    maxWidth: '700px',
                    width: '100%',
                    margin: '0 auto',
                }}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message…"
                        rows={1}
                        maxLength={1000}
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            resize: 'none',
                            outline: 'none',
                            lineHeight: 1.5,
                            maxHeight: '120px',
                            overflowY: 'auto',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.15s ease',
                        }}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={sending || !input.trim()}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: input.trim() && !sending ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            color: input.trim() && !sending ? '#fff' : 'var(--text-muted)',
                            cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'background 0.15s ease, color 0.15s ease',
                        }}
                        title="Send (Enter)"
                    >
                        ↑
                    </button>
                </div>
            </div>

            <style>{`
            @keyframes msg-enter {
                from {
                    opacity: 0;
                    transform: translateY(6px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `}</style>
        </>
    );
}
