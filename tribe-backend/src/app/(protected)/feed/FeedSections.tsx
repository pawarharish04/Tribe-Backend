'use client';

import { useState, useRef, useCallback } from 'react';
import CompatibilityBadge from '../../../components/ui/CompatibilityBadge';
import InterestTag from '../../../components/ui/InterestTag';

// ── Types ──────────────────────────────────────────────────────────────────────
interface FeedUser {
    id: string;
    displayName: string;
    revealed: boolean;
    distanceKm: number | null;
    distanceHidden?: boolean;
    lastActiveAt?: string;
    score: number;
    interests: { interestId: string; interest: { id: string; name: string; parentId: string | null } }[];
    posts: { id: string; caption: string | null; media: { url: string; type: string } | null; interest: { id: string; name: string } }[];
}

// ── Distance pill helper ───────────────────────────────────────────────────────
function DistancePill({ user }: { user: FeedUser }) {
    if (user.distanceHidden) return null;
    if (user.distanceKm == null) return null;
    const text = user.revealed ? `${Math.round(user.distanceKm)} km away` : `~${Math.round(user.distanceKm / 5) * 5} km away`;
    return (
        <span style={{
            padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.16)',
            color: 'rgba(248,250,252,0.70)',
            backdropFilter: 'blur(8px)',
        }}>
            📍 {text}
        </span>
    );
}

// ── Mini Post Gallery (inside the card) ────────────────────────────────────────
function MiniGallery({ posts, revealed }: { posts: FeedUser['posts']; revealed: boolean }) {
    const visible = posts.slice(0, 3);
    if (visible.length === 0) return null;

    return (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {visible.map((post, idx) => {
                const locked = !revealed && idx >= 2;
                return (
                    <div key={post.id} style={{
                        position: 'relative', flexShrink: 0,
                        width: '72px', height: '72px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        overflow: 'hidden',
                    }}>
                        {post.media?.type === 'video'
                            ? <video src={post.media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                            : post.media
                            ? <img src={post.media.url} alt={post.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎨</div>
                        }
                        {locked && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                backdropFilter: 'blur(8px)',
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '16px',
                            }}>🔒</div>
                        )}
                        {/* Interest label */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '3px 5px',
                            background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)',
                            fontSize: '8px', fontFamily: 'Inter, sans-serif',
                            color: 'rgba(255,255,255,0.8)', fontWeight: 500,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {post.interest.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Feed Card Component ────────────────────────────────────────────────────────
interface FeedCardProps {
    user: FeedUser;
    onLike: () => void;
    onPass: () => void;
    onSuperlike: () => void;
    stacked?: boolean;  // is this a background card in the stack?
    stackDepth?: number;
}

function FeedCard({ user, onLike, onPass, onSuperlike, stacked = false, stackDepth = 0 }: FeedCardProps) {
    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [action, setAction] = useState<'like' | 'pass' | 'superlike' | null>(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const cardRef = useRef<HTMLDivElement>(null);

    const THRESHOLD = 80;

    const onPointerDown = (e: React.PointerEvent) => {
        if (stacked) return;
        startX.current = e.clientX;
        startY.current = e.clientY;
        setIsDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging || stacked) return;
        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;
        setDragX(dx);
        setDragY(dy);
        if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) setAction('superlike');
        else if (dx > 40) setAction('like');
        else if (dx < -40) setAction('pass');
        else setAction(null);
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragX > THRESHOLD) { onLike(); return; }
        if (dragX < -THRESHOLD) { onPass(); return; }
        if (dragY < -THRESHOLD) { onSuperlike(); return; }
        setDragX(0); setDragY(0); setAction(null);
    };

    const rotate = stacked ? 0 : (dragX / 15);
    const translateX = stacked ? (stackDepth * 4) : dragX;
    const translateY = stacked ? (-stackDepth * 8) : dragY;
    const scale = stacked ? (1 - stackDepth * 0.04) : 1;

    const overlayOpacity = Math.min(1, Math.abs(dragX) / THRESHOLD);

    const nameDisplay = user.revealed ? user.displayName : `${user.displayName.split(' ')[0]} ✦✦✦`;

    return (
        <div
            ref={cardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: stacked ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                userSelect: 'none',
                touchAction: 'none',
                transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                background: 'rgba(15,15,24,0.95)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: stacked ? '0 8px 32px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.7)',
                zIndex: stacked ? (10 - stackDepth) : 20,
            }}
        >
            {/* LIKE overlay */}
            {!stacked && action === 'like' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-start', paddingTop: '40px', paddingLeft: '32px', background: 'rgba(16,185,129,0.08)' }}>
                    <span style={{ fontSize: '48px', transform: 'rotate(-15deg)', filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.8))' }}>❤️</span>
                </div>
            )}
            {/* PASS overlay */}
            {!stacked && action === 'pass' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingTop: '40px', paddingRight: '32px', background: 'rgba(239,68,68,0.08)' }}>
                    <span style={{ fontSize: '48px', transform: 'rotate(15deg)', filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.8))' }}>✖️</span>
                </div>
            )}
            {/* SUPERLIKE overlay */}
            {!stacked && action === 'superlike' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px', background: 'rgba(245,158,11,0.08)' }}>
                    <span style={{ fontSize: '52px', filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.9))' }}>⭐</span>
                </div>
            )}

            {/* Avatar / Hero area */}
            <div style={{
                height: '220px',
                background: user.revealed
                    ? 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.20))'
                    : 'rgba(255,255,255,0.04)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Blurred background pattern when unrevealed */}
                {!user.revealed && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.10))',
                        backdropFilter: 'blur(0px)',
                    }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.08)',
                                border: '2px solid rgba(255,255,255,0.16)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '32px',
                                filter: 'blur(2px)',
                            }}>
                                {user.displayName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Compatibility badge - top right */}
                <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 5 }}>
                    <CompatibilityBadge score={Math.round(user.score)} size="md" />
                </div>

                {/* Gradient overlay at bottom of hero */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                    background: 'linear-gradient(to top, rgba(15,15,24,0.95), transparent)',
                }} />
            </div>

            {/* Card Content */}
            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Name + distance */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                        <div style={{
                            fontSize: '20px', fontWeight: 700,
                            fontFamily: 'Inter, sans-serif',
                            letterSpacing: '-0.02em', color: '#f8fafc',
                            filter: user.revealed ? 'none' : 'blur(0px)',
                        }}>
                            {nameDisplay}
                        </div>
                        <DistancePill user={user} />
                    </div>
                </div>

                {/* Interests */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {user.interests.slice(0, 4).map(ui => (
                        <InterestTag key={ui.interestId} name={ui.interest.name} size="sm" />
                    ))}
                    {user.interests.length > 4 && (
                        <span style={{ fontSize: '11px', color: 'rgba(248,250,252,0.35)', fontFamily: 'Inter, sans-serif', alignSelf: 'center' }}>
                            +{user.interests.length - 4} more
                        </span>
                    )}
                </div>

                {/* Mini post gallery */}
                <MiniGallery posts={user.posts} revealed={user.revealed} />

                {user.revealed && (
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#14b8a6', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '-4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#14b8a6', boxShadow: '0 0 6px #14b8a6', flexShrink: 0 }} />
                        Identity revealed — you matched!
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Action Buttons At Bottom ───────────────────────────────────────────────────
function ActionButtons({ onPass, onSuperlike, onLike, disabled }: { onPass: () => void; onSuperlike: () => void; onLike: () => void; disabled?: boolean; }) {
    const [pressed, setPressed] = useState<string | null>(null);

    const btn = (id: string, label: string, emoji: string, color: string, glow: string, action: () => void) => (
        <button
            disabled={disabled}
            onClick={() => { setPressed(id); action(); setTimeout(() => setPressed(null), 400); }}
            style={{
                width: id === 'superlike' ? '52px' : '64px',
                height: id === 'superlike' ? '52px' : '64px',
                borderRadius: '50%',
                background: pressed === id ? `${color}30` : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${pressed === id ? color : 'rgba(255,255,255,0.12)'}`,
                backdropFilter: 'blur(12px)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: pressed === id ? '30px' : '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: pressed === id ? `0 0 24px ${glow}` : 'none',
                transform: pressed === id ? 'scale(1.2)' : 'scale(1)',
            }}
        >
            {emoji}
        </button>
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '16px 0 8px' }}>
            {btn('pass', 'Pass', '✖️', '#ef4444', 'rgba(239,68,68,0.5)', onPass)}
            {btn('superlike', 'Super', '⭐', '#f59e0b', 'rgba(245,158,11,0.5)', onSuperlike)}
            {btn('like', 'Like', '❤️', '#10b981', 'rgba(16,185,129,0.5)', onLike)}
        </div>
    );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '500px', gap: '20px', textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '56px', animation: 'float 3s ease-in-out infinite' }}>✨</div>
            <div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    You've seen everyone nearby
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(248,250,252,0.45)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                    New creators join every day.<br />Check back soon to discover more.
                </div>
            </div>
        </div>
    );
}

// ── Needs Interests State ─────────────────────────────────────────────────────
function NeedsInterests() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '500px', gap: '20px', textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '56px' }}>🎨</div>
            <div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '8px' }}>Add your interests</div>
                <div style={{ fontSize: '14px', color: 'rgba(248,250,252,0.45)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, marginBottom: '24px' }}>
                    Your feed is curated by creative compatibility.<br />Tell us what you're into.
                </div>
                <a href="/me" style={{
                    display: 'inline-block', padding: '12px 28px', borderRadius: '999px',
                    background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                    color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    textDecoration: 'none', boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
                }}>
                    Set Up Profile →
                </a>
            </div>
        </div>
    );
}

// ── Main FeedSections ─────────────────────────────────────────────────────────
export default function FeedSections({
    forYou,
    compatibleCreators,
}: {
    forYou: FeedUser[];
    compatibleCreators: any[];
    creativeWorks: any[];
    newCreators: any[];
}) {
    // Merge forYou + compatibleCreators into one unified deck
    const rawDeck: FeedUser[] = [
        ...forYou,
        ...(Array.isArray(compatibleCreators) ? compatibleCreators : []),
    ];

    // Deduplicate by id
    const seen = new Set<string>();
    const deck = rawDeck.filter(u => { if (seen.has(u.id)) return false; seen.add(u.id); return true; });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | null>(null);

    const jwt = typeof window !== 'undefined' ? localStorage.getItem('tribe_jwt') : null;

    const sendInteraction = useCallback(async (targetId: string, type: 'LIKE' | 'PASS' | 'SUPERLIKE') => {
        if (!jwt) return;
        try {
            await fetch('/api/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body: JSON.stringify({ targetId, type }),
            });
        } catch {}
    }, [jwt]);

    const advance = useCallback((dir: 'left' | 'right' | 'up', type: 'LIKE' | 'PASS' | 'SUPERLIKE') => {
        const card = deck[currentIndex];
        if (!card) return;
        setSwipeDir(dir);
        sendInteraction(card.id, type);
        setTimeout(() => {
            setCurrentIndex(i => i + 1);
            setSwipeDir(null);
        }, 380);
    }, [currentIndex, deck, sendInteraction]);

    const needsInterests = (forYou as any)?.needsInterests;
    if (needsInterests) return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
            <NeedsInterests />
        </div>
    );

    const current = deck[currentIndex];
    const next = deck[currentIndex + 1];
    const afterNext = deck[currentIndex + 2];

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{
                        fontSize: '24px', fontWeight: 800,
                        fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em',
                        background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '2px',
                    }}>Discover</h1>
                    <p style={{ fontSize: '13px', color: 'rgba(248,250,252,0.40)', fontFamily: 'Inter, sans-serif' }}>
                        {deck.length > 0 ? `${deck.length - currentIndex} creators left` : 'Finding your people…'}
                    </p>
                </div>
                {current && (
                    <div style={{ fontSize: '11px', color: 'rgba(248,250,252,0.30)', fontFamily: 'Inter, sans-serif' }}>
                        {currentIndex + 1} / {deck.length}
                    </div>
                )}
            </div>

            {/* Card Stack */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
                {deck.length === 0 || currentIndex >= deck.length ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Stack area */}
                        <div style={{
                            position: 'relative',
                            height: '520px',
                            maxWidth: '420px',
                            width: '100%',
                            margin: '0 auto',
                        }}>
                            {/* Depth card 2 (furthest back) */}
                            {afterNext && (
                                <FeedCard key={afterNext.id} user={afterNext}
                                    onLike={() => {}} onPass={() => {}} onSuperlike={() => {}}
                                    stacked stackDepth={2}
                                />
                            )}
                            {/* Depth card 1 */}
                            {next && (
                                <FeedCard key={next.id} user={next}
                                    onLike={() => {}} onPass={() => {}} onSuperlike={() => {}}
                                    stacked stackDepth={1}
                                />
                            )}
                            {/* Active card */}
                            {current && (
                                <div key={current.id} style={{
                                    position: 'absolute', inset: 0,
                                    animation: swipeDir === 'right' ? 'swipeRight 0.38s ease forwards'
                                              : swipeDir === 'left'  ? 'swipeLeft 0.38s ease forwards'
                                              : swipeDir === 'up'    ? 'swipeUp 0.38s ease forwards'
                                              : undefined,
                                }}>
                                    <FeedCard
                                        user={current}
                                        onLike={() => advance('right', 'LIKE')}
                                        onPass={() => advance('left', 'PASS')}
                                        onSuperlike={() => advance('up', 'SUPERLIKE')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
                            <ActionButtons
                                disabled={!current}
                                onLike={() => advance('right', 'LIKE')}
                                onPass={() => advance('left', 'PASS')}
                                onSuperlike={() => advance('up', 'SUPERLIKE')}
                            />
                            {/* Swipe hint */}
                            <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(248,250,252,0.20)', fontFamily: 'Inter, sans-serif', marginTop: '8px' }}>
                                Drag the card or use the buttons
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
