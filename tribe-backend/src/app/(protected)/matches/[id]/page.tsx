'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import MatchList, { type MatchListItem } from '../../../../components/matches/MatchList';
import { T } from '../../../../design/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

// ─── Chat Pane ────────────────────────────────────────────────────────────────

interface ChatPaneProps { matchId: string; jwt: string; myId: string; partnerName: string; partnerId: string; }

function ChatPane({ matchId, jwt, myId, partnerName, partnerId }: ChatPaneProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [initialLoad, setInitialLoad] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const [newIds, setNewIds] = useState<Set<string>>(new Set());
    const socketRef = useRef<Socket | null>(null);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPartnerOnline, setIsPartnerOnline] = useState(false);

    const loadMessages = useCallback(async (silent = false) => {
        if (!jwt || !matchId) return;
        try {
            const res = await fetch(`/api/matches/${matchId}/messages`, { headers: { Authorization: `Bearer ${jwt}` } });
            if (res.status === 403) { setLoadError('You are not a member of this match.'); return; }
            const data = await res.json();
            const incoming: Message[] = data.messages ?? [];
            const freshIds = new Set<string>();
            for (const msg of incoming) { if (!seenIdsRef.current.has(msg.id)) freshIds.add(msg.id); }
            for (const msg of incoming) { seenIdsRef.current.add(msg.id); }
            setMessages(incoming);
            if (freshIds.size > 0) { setNewIds(freshIds); setTimeout(() => setNewIds(new Set()), 300); }
        } catch { if (!silent) setLoadError('Failed to load messages.'); }
        finally { setInitialLoad(false); }
    }, [jwt, matchId]);

    useEffect(() => { if (!jwt || !matchId) return; loadMessages(); }, [jwt, matchId, loadMessages]);

    // Socket.io
    useEffect(() => {
        if (!matchId || !jwt) return;
        const socketUrl = `http://${window.location.hostname}:4000`;
        const socket = io(socketUrl, { auth: { token: jwt } });
        socketRef.current = socket;

        socket.on('connect', () => { socket.emit('join_match', matchId); });
        socket.on('new_message', (message: Message & { clientTempId?: string }) => {
            const { clientTempId, ...msg } = message;
            if (clientTempId) { seenIdsRef.current.add(msg.id); setMessages(prev => prev.map(m => m.id === clientTempId ? msg : m)); }
            else { if (seenIdsRef.current.has(msg.id)) return; seenIdsRef.current.add(msg.id); setMessages(prev => [...prev, msg]); setNewIds(new Set([msg.id])); setTimeout(() => setNewIds(new Set()), 300); }
        });
        socket.on('typing_start', ({ userId }) => { if (userId !== myId) setIsPartnerTyping(true); });
        socket.on('typing_stop', ({ userId }) => { if (userId !== myId) setIsPartnerTyping(false); });
        socket.on('presence_status', ({ userId, online }: { userId: string; online: boolean }) => { if (userId === partnerId) setIsPartnerOnline(online); });
        socket.on('user_online', ({ userId }: { userId: string }) => { if (userId === partnerId) setIsPartnerOnline(true); });
        socket.on('user_offline', ({ userId }: { userId: string }) => { if (userId === partnerId) setIsPartnerOnline(false); });

        return () => {
            ['new_message', 'typing_start', 'typing_stop', 'presence_status', 'user_online', 'user_offline', 'connect', 'disconnect'].forEach(e => socket.off(e));
            socket.disconnect(); socketRef.current = null;
        };
    }, [matchId, jwt, myId, partnerId]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: messages.length <= 1 ? 'instant' : 'smooth' } as any); }, [messages, isPartnerTyping]);

    const handleTyping = () => {
        socketRef.current?.emit('typing_start', matchId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => { socketRef.current?.emit('typing_stop', matchId); }, 1500);
    };

    const sendMessage = async () => {
        const content = input.trim();
        if (!content || sending || !socketRef.current) return;
        setSending(true);
        const clientTempId = `opt-${Date.now()}`;
        setMessages(prev => [...prev, { id: clientTempId, senderId: myId, content, createdAt: new Date().toISOString() }]);
        setInput('');
        socketRef.current.emit('send_message', { matchId, content, clientTempId });
        setSending(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // Group by date
    const grouped: { date: string; messages: Message[] }[] = [];
    for (const msg of messages) {
        const d = new Date(msg.createdAt).toDateString();
        const last = grouped[grouped.length - 1];
        if (!last || last.date !== d) grouped.push({ date: d, messages: [msg] });
        else last.messages.push(msg);
    }

    return (
        <>
            {/* Chat sub-header */}
            <div style={{ height: '52px', borderBottom: `1px solid ${T.sep}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0, background: T.cream2 }}>
                {/* Avatar */}
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: T.parchment, border: `1.5px solid ${T.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 700, color: T.inkMid, flexShrink: 0, position: 'relative' }}>
                    {partnerName.charAt(0).toUpperCase()}
                    {isPartnerOnline && <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '7px', height: '7px', borderRadius: '50%', background: T.sage, border: `1.5px solid ${T.cream2}` }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 700, fontSize: '14px', color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partnerName}</div>
                    <div style={{ fontSize: '10px', fontFamily: 'Georgia,serif', color: isPartnerOnline ? T.sage : T.inkFaint, display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.3s', letterSpacing: '0.04em' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPartnerOnline ? T.sage : T.inkFaint, display: 'inline-block', transition: 'background 0.3s' }} />
                        {isPartnerOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
            </div>

            {loadError && <div style={{ padding: '10px 20px', background: T.claySoft, color: T.clay, fontSize: '12px', textAlign: 'center', flexShrink: 0, fontFamily: 'Georgia,serif' }}>{loadError}</div>}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '2px', background: T.cream }}>
                {initialLoad && <div style={{ textAlign: 'center', color: T.inkFaint, fontSize: '13px', padding: '40px 0', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic' }}>Loading messages…</div>}

                {!initialLoad && messages.length === 0 && !loadError && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: T.inkFaint }}>
                        <div style={{ fontSize: '28px', marginBottom: '14px', opacity: 0.4 }}>◎</div>
                        <div style={{ fontSize: '16px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', color: T.inkLight, marginBottom: '6px' }}>Start the conversation</div>
                        <div style={{ fontSize: '13px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkFaint, lineHeight: 1.6 }}>You and {partnerName} matched.<br />Say something genuine.</div>
                    </div>
                )}

                {grouped.map(group => (
                    <div key={group.date}>
                        {/* Date separator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 10px' }}>
                            <div style={{ flex: 1, height: '1px', background: T.sep }} />
                            <span style={{ fontSize: '9px', color: T.inkFaint, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia,serif' }}>{formatDateSeparator(group.messages[0].createdAt)}</span>
                            <div style={{ flex: 1, height: '1px', background: T.sep }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {group.messages.map((msg, i) => {
                                const isMine = msg.senderId === myId;
                                const isSameAuthor = group.messages[i - 1]?.senderId === msg.senderId;
                                return (
                                    <div key={msg.id} style={{
                                        display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row',
                                        alignItems: 'flex-end', gap: '8px',
                                        marginTop: isSameAuthor ? '0' : '8px',
                                        animation: newIds.has(msg.id) ? 'rIn 0.18s ease-out both' : 'none',
                                    }}>
                                        <div style={{
                                            maxWidth: '70%', padding: '10px 14px',
                                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: isMine ? T.sage : 'white',
                                            border: isMine ? 'none' : `1px solid ${T.sep}`,
                                            color: isMine ? T.cream : T.ink,
                                            fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif",
                                            lineHeight: 1.55, wordBreak: 'break-word',
                                            opacity: msg.id.startsWith('opt-') ? 0.65 : 1,
                                            transition: 'opacity 0.2s',
                                            boxShadow: isMine ? `0 2px 8px ${T.sage}30` : '0 1px 4px rgba(28,25,23,0.06)',
                                        }}>
                                            {msg.content}
                                            <div style={{ fontSize: '10px', marginTop: '4px', fontFamily: 'Georgia,serif', color: isMine ? 'rgba(247,243,237,0.55)' : T.inkFaint, textAlign: isMine ? 'right' : 'left' }}>
                                                {formatTime(msg.createdAt)}{msg.id.startsWith('opt-') && ' · sending'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {isPartnerTyping && (
                    <div style={{ fontSize: '12px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', color: T.inkFaint, padding: '4px 8px' }}>
                        {partnerName} is typing…
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{ borderTop: `1px solid ${T.sep}`, background: T.cream2, padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
                <textarea ref={inputRef} value={input}
                    onChange={e => { setInput(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message…"
                    rows={1} maxLength={1000}
                    style={{
                        flex: 1, background: 'white', border: `1px solid ${T.sep}`,
                        borderRadius: '12px', padding: '10px 14px', color: T.ink,
                        fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif",
                        resize: 'none', outline: 'none', lineHeight: 1.55,
                        maxHeight: '120px', overflowY: 'auto', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = T.sage)}
                    onBlur={e => (e.target.style.borderColor = T.sep)}
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()} title="Send (Enter)"
                    style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: input.trim() && !sending ? T.sage : T.parchment,
                        border: `1px solid ${input.trim() && !sending ? T.sage : T.sep}`,
                        color: input.trim() && !sending ? T.cream : T.inkFaint,
                        cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                        fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.15s',
                    }}>↑</button>
            </div>
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

    const [jwt, setJwt] = useState('');
    const [myId, setMyId] = useState('');
    const [matches, setMatches] = useState<MatchListItem[]>([]);
    const [partnerName, setPartnerName] = useState('Match');
    const [partnerId, setPartnerId] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('tribe_jwt');
        if (!stored) { router.push('/login'); return; }
        setJwt(stored);
        try { const payload = JSON.parse(atob(stored.split('.')[1])); setMyId(payload.userId ?? payload.id ?? payload.sub ?? ''); } catch { }
    }, [router]);

    useEffect(() => {
        if (!jwt) return;
        fetch('/api/matches', { headers: { Authorization: `Bearer ${jwt}` } })
            .then(r => r.json())
            .then(data => {
                const list: MatchListItem[] = data.matches ?? [];
                setMatches(list);
                const active = list.find(m => m.matchId === matchId);
                if (active?.name) setPartnerName(active.name);
                if (active?.id) setPartnerId(active.id);
            })
            .catch(() => { });
    }, [jwt, matchId]);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: T.cream }}>

            {/* Sidebar */}
            <aside style={{ width: '17rem', flexShrink: 0, borderRight: `1px solid ${T.sep}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.cream2 }}>
                <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${T.sep}`, flexShrink: 0 }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: 'Georgia,serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Matches
                        {matches.length > 0 && (
                            <span style={{ padding: '1px 7px', borderRadius: '20px', background: T.sageSoft, color: T.sage, fontSize: '9px', textTransform: 'none', border: `1px solid ${T.sage}35` }}>
                                {matches.length}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <MatchList matches={matches} activeId={matchId} />
                </div>
            </aside>

            {/* Chat area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                {jwt && matchId && (
                    <ChatPane matchId={matchId} jwt={jwt} myId={myId} partnerName={partnerName} partnerId={partnerId} />
                )}
            </main>
        </div>
    );
}
