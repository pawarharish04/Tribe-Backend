'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    type ProfileData, type Stats, type PostItem, type UserInterestItem,
} from '../../../components/profile/ProfileEditor';

// ── Apple HIG palette (one per interest) ──────────────────────────────────────
const PALETTES = [
    { accent: '#FF9500', glow: '#FF9500', bg: ['#FFF8EE', '#FFF0D6', '#FFE4B5'], icon: '⬡' },  // orange / cream
    { accent: '#5856D6', glow: '#5856D6', bg: ['#F5F0FF', '#EBE4FF', '#D8CCFF'], icon: '◈' },  // indigo / lavender
    { accent: '#FF2D55', glow: '#FF2D55', bg: ['#FFF0F3', '#FFE0E7', '#FFCCD6'], icon: '◎' },  // pink / blush
    { accent: '#32ADE6', glow: '#32ADE6', bg: ['#F0F8FF', '#DDF0FF', '#C2E4FF'], icon: '◇' },  // teal / sky
    { accent: '#007AFF', glow: '#007AFF', bg: ['#F0F6FF', '#DDEAFF', '#C2D6FF'], icon: '⬡' },  // blue
    { accent: '#34C759', glow: '#34C759', bg: ['#F0FFF5', '#DDFFF0', '#BCFFE0'], icon: '◈' },  // green
    { accent: '#FF375F', glow: '#FF375F', bg: ['#FFF0F3', '#FFDDE4', '#FFC4CF'], icon: '◎' },  // rose
    { accent: '#FF6B00', glow: '#FF6B00', bg: ['#FFF5EC', '#FFE9D4', '#FFD9B8'], icon: '◇' },  // deep orange
] as const;

const PATTERNS = ['rings', 'lines', 'dots', 'grid', 'matrix', 'waves', 'geo'];
const STRENGTH_LABELS: Record<number, string> = { 1: 'CURIOUS', 2: 'SERIOUS', 3: 'CORE' };

// Colours for readable text on the light page
const T1 = '#1d1d1f';   // Apple primary
const T2 = '#6e6e73';   // Apple secondary
const T3 = '#8e8e93';   // Apple tertiary

function timeSince(d: string) {
    const ms = Date.now() - new Date(d).getTime();
    const days = Math.floor(ms / 86400000);
    if (days >= 7) return `${Math.floor(days / 7)}w`;
    if (days > 0) return `${days}d`;
    const h = Math.floor(ms / 3600000); if (h > 0) return `${h}h`;
    const m = Math.floor(ms / 60000); if (m > 0) return `${m}m`;
    return 'now';
}

type Palette = (typeof PALETTES)[number];
type EnrichedPost = PostItem & { pattern: string; accent: string; glow: string; gradientBg: string };
type InterestGroup = { id: string; name: string; level: number; palette: Palette; posts: EnrichedPost[] };

// ── SVG Patterns ──────────────────────────────────────────────────────────────
function Pattern({ type, accent }: { type: string; accent: string }) {
    const s: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 };
    if (type === 'rings') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{[25, 55, 85, 115].map((r, i) => <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={accent} strokeWidth="1.2" />)}</svg>;
    if (type === 'lines') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 25} y1="0" x2={i * 25 + 50} y2="200" stroke={accent} strokeWidth="1" />)}</svg>;
    if (type === 'dots') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 25 }, (_, i) => <circle key={i} cx={(i % 5) * 44 + 12} cy={Math.floor(i / 5) * 44 + 12} r="2.5" fill={accent} />)}</svg>;
    if (type === 'grid') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 6 }, (_, i) => [<line key={`h${i}`} x1="0" y1={i * 40} x2="200" y2={i * 40} stroke={accent} strokeWidth="0.8" />, <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="200" stroke={accent} strokeWidth="0.8" />])}</svg>;
    if (type === 'matrix') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{['01', '10', '11', '00', '10', '01', '11', '00', '01', '10'].map((t, i) => <text key={i} x={(i % 4) * 52 + 4} y={Math.floor(i / 4) * 48 + 30} fill={accent} fontSize="13" fontFamily="monospace">{t}</text>)}</svg>;
    if (type === 'waves') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{[0, 1, 2, 3, 4].map(i => <path key={i} d={`M0,${60 + i * 28} Q50,${40 + i * 28} 100,${60 + i * 28} T200,${60 + i * 28}`} fill="none" stroke={accent} strokeWidth="1.5" />)}</svg>;
    if (type === 'geo') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><polygon points="100,15 185,80 155,175 45,175 15,80" fill="none" stroke={accent} strokeWidth="1" /><polygon points="100,40 162,90 138,158 62,158 38,90" fill="none" stroke={accent} strokeWidth="0.6" /></svg>;
    return null;
}

// ── Curved Carousel ───────────────────────────────────────────────────────────
function CurvedCarousel({ group, onCardClick }: { group: InterestGroup; onCardClick: (p: EnrichedPost) => void }) {
    const { posts, palette } = group;
    const { accent, glow, bg, icon } = palette;
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [offsetStart, setOffsetStart] = useState(0);
    const [hovered, setHovered] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef(0); const velRef = useRef(0);
    const lastXRef = useRef(0); const lastTRef = useRef(0);
    const CW = 200; const CH = 240; const STEP = CW + 24; const MAX = Math.max(0, posts.length - 1);

    function xform(idx: number, sc: number) {
        const rel = idx - sc; const x = rel * STEP * 0.72;
        const y = 0.012 * x * x; const rotZ = -Math.atan(2 * 0.012 * x) * (180 / Math.PI) * 0.7;
        const dist = Math.abs(rel);
        return { x, y, rotZ, scale: Math.max(0.72, 1 - dist * 0.07), z: -dist * 30, opacity: Math.max(0.25, 1 - dist * 0.18) };
    }
    const momentum = useCallback(() => { cancelAnimationFrame(rafRef.current); const go = () => { velRef.current *= 0.92; if (Math.abs(velRef.current) < 0.001) return; setOffset(o => Math.max(0, Math.min(MAX, o + velRef.current))); rafRef.current = requestAnimationFrame(go); }; rafRef.current = requestAnimationFrame(go); }, [MAX]);
    const onPD = (e: React.PointerEvent) => { cancelAnimationFrame(rafRef.current); setIsDragging(true); setDragStart(e.clientX); setOffsetStart(offset); lastXRef.current = e.clientX; lastTRef.current = Date.now(); velRef.current = 0; e.currentTarget.setPointerCapture(e.pointerId); };
    const onPM = (e: React.PointerEvent) => { if (!isDragging) return; const dx = e.clientX - dragStart; const now = Date.now(); velRef.current = -(e.clientX - lastXRef.current) / Math.max(1, now - lastTRef.current) * 0.18; lastXRef.current = e.clientX; lastTRef.current = now; setOffset(Math.max(0, Math.min(MAX, offsetStart - dx / STEP))); };
    const onPU = () => { setIsDragging(false); momentum(); };
    const nudge = (d: number) => { cancelAnimationFrame(rafRef.current); setOffset(o => Math.max(0, Math.min(MAX, Math.round(o) + d))); };
    const [cw, setCw] = useState(800);
    useEffect(() => { const el = containerRef.current; if (!el) return; const ro = new ResizeObserver(e => setCw(e[0].contentRect.width)); ro.observe(el); return () => ro.disconnect(); }, []);
    const cx = cw / 2;

    return (
        <div style={{ marginBottom: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '17px', color: accent }}>{icon}</span>
                    <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T3, fontFamily: "'Space Mono',monospace" }}>{group.name}</span>
                    <span style={{ fontSize: '9px', padding: '2px 8px', background: `${accent}14`, border: `1px solid ${accent}40`, borderRadius: '100px', color: accent, fontFamily: "'Space Mono',monospace", letterSpacing: '0.08em' }}>{STRENGTH_LABELS[group.level]}</span>
                </div>
                {posts.length > 1 && <div style={{ display: 'flex', gap: '6px' }}>
                    {([-1, 1] as const).map(d => (
                        <button key={d} onClick={() => nudge(d)} style={{ width: '28px', height: '28px', background: `${accent}12`, border: `1px solid ${accent}30`, borderRadius: '7px', color: accent, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}22`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${accent}12`; }}
                        >{d === -1 ? '←' : '→'}</button>
                    ))}
                </div>}
            </div>

            <div ref={containerRef} onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerCancel={onPU}
                style={{ position: 'relative', height: `${CH + 90}px`, overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${cw} ${CH + 90}`} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`rail-${group.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={accent} stopOpacity="0" />
                            <stop offset="30%" stopColor={accent} stopOpacity="0.2" />
                            <stop offset="50%" stopColor={accent} stopOpacity="0.45" />
                            <stop offset="70%" stopColor={accent} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0" />
                        </linearGradient>
                        <filter id={`blur-${group.id}`}><feGaussianBlur stdDeviation="3" /></filter>
                    </defs>
                    {[18, 30].map((_, ri) => {
                        const y0 = 28 + ri * 14; const sp = 1.4 + ri * 0.1;
                        const pd = `M 0,${y0 + 0.012 * (cx * sp) ** 2 * 0.4} Q ${cx},${y0} ${cw},${y0 + 0.012 * (cx * sp) ** 2 * 0.4}`;
                        return <path key={ri} d={pd} fill="none" stroke={`url(#rail-${group.id})`} strokeWidth={ri === 0 ? '1.5' : '1'} filter={ri === 0 ? `url(#blur-${group.id})` : undefined} opacity={ri === 0 ? 0.8 : 0.35} />;
                    })}
                </svg>

                {posts.map((post, i) => {
                    const { x, y, rotZ, scale, z, opacity } = xform(i, offset);
                    const sx = cx + x - CW / 2; const sy = 38 + y;
                    const isC = Math.abs(i - offset) < 0.6; const isH = hovered === post.id;
                    return (
                        <div key={post.id} onMouseEnter={() => setHovered(post.id)} onMouseLeave={() => setHovered(null)}
                            onClick={() => { if (!isDragging) onCardClick(post); }}
                            style={{
                                position: 'absolute', left: `${sx}px`, top: `${sy}px`, width: `${CW}px`, height: `${CH}px`,
                                transform: `perspective(900px) translateZ(${z + (isH ? 20 : 0)}px) rotate(${rotZ}deg) scale(${scale * (isH ? 1.06 : 1)})`,
                                transformOrigin: 'center bottom', opacity,
                                transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.34,1.4,0.64,1), opacity 0.35s ease, box-shadow 0.3s ease',
                                cursor: 'pointer', zIndex: Math.round(scale * 10), borderRadius: '18px',
                                background: post.media ? 'white' : `linear-gradient(145deg,${bg[0]},${bg[1]},${bg[2]})`,
                                border: `1px solid ${isC || isH ? accent + '55' : 'rgba(0,0,0,0.07)'}`,
                                boxShadow: isH
                                    ? `0 16px 40px ${glow}25, 0 0 0 1px ${accent}25, 0 4px 12px rgba(0,0,0,0.1)`
                                    : isC ? `0 8px 24px rgba(0,0,0,0.12), 0 0 16px ${glow}18`
                                        : `0 2px 10px rgba(0,0,0,0.07)`,
                                overflow: 'hidden',
                            }}
                        >
                            {post.media ? (
                                post.media.type === 'video'
                                    ? <video src={post.media.url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                    : <img src={post.media.url} alt={post.caption ?? ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : <Pattern type={post.pattern} accent={accent} />}

                            {/* Glow orb */}
                            <div style={{ position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '120px', background: glow, borderRadius: '50%', filter: 'blur(50px)', opacity: isH ? 0.2 : 0.08, transition: 'opacity 0.3s', pointerEvents: 'none' }} />

                            {/* Caption bar */}
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px',
                                background: post.media ? 'linear-gradient(to top,rgba(0,0,0,0.62) 0%,transparent 55%)' : 'linear-gradient(to top,rgba(0,0,0,0.08) 0%,transparent 60%)'
                            }}>
                                <p style={{ fontSize: '11.5px', lineHeight: '1.55', color: post.media ? 'rgba(255,255,255,0.9)' : T1, fontFamily: "'DM Sans',sans-serif", margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {post.caption ?? '—'}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', color: post.media ? accent : accent, fontFamily: "'Space Mono',monospace" }}>♥ {post._count.likes}</span>
                                    <span style={{ fontSize: '10px', color: post.media ? 'rgba(255,255,255,0.5)' : T3, fontFamily: "'Space Mono',monospace" }}>{timeSince(post.createdAt)}</span>
                                </div>
                            </div>

                            {isC && <div style={{ position: 'absolute', inset: 0, borderRadius: '18px', boxShadow: `inset 0 0 0 1.5px ${accent}50`, pointerEvents: 'none' }} />}
                        </div>
                    );
                })}

                {/* Edge fade masks — use page bg */}
                {(['left', 'right'] as const).map(side => (
                    <div key={side} style={{
                        position: 'absolute', top: 0, bottom: 0, [side]: 0, width: '80px', pointerEvents: 'none',
                        background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'},#F5F5F7 0%,transparent 100%)`, zIndex: 20
                    }} />
                ))}
            </div>

            {posts.length > 1 && <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                {posts.map((_, i) => {
                    const dist = Math.abs(i - offset); return (
                        <div key={i} onClick={() => setOffset(i)} style={{ width: dist < 0.5 ? '18px' : '5px', height: '5px', borderRadius: '3px', background: dist < 0.5 ? accent : `${accent}35`, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.34,1.4,0.64,1)' }} />
                    );
                })}
            </div>}
        </div>
    );
}

// ── Modal — iOS frosted glass ─────────────────────────────────────────────────
function Modal({ post, onClose }: { post: EnrichedPost; onClose: () => void }) {
    const { accent, glow, gradientBg, pattern } = post;
    useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; }; }, [onClose]);
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '540px', background: 'rgba(255,255,255,0.97)', borderRadius: '24px', overflow: 'hidden', boxShadow: `0 32px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)`, animation: 'slideUp 0.32s cubic-bezier(0.34,1.5,0.64,1)' }}>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    {post.media ? (
                        post.media.type === 'video'
                            ? <video src={post.media.url} style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', background: '#f0f0f0', display: 'block' }} controls autoPlay muted />
                            : <img src={post.media.url} alt={post.caption ?? ''} style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', background: '#f5f5f7', display: 'block' }} />
                    ) : (
                        <div style={{ height: '240px', background: gradientBg, position: 'relative' }}>
                            <Pattern type={pattern} accent={accent} />
                            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 70%,${accent}20 0%,transparent 60%)` }} />
                        </div>
                    )}
                    {/* Glassmorphic close */}
                    <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '50%', width: '34px', height: '34px', color: T1, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>✕</button>
                    {/* Interest tag */}
                    <div style={{ position: 'absolute', bottom: '12px', left: '14px', fontSize: '10px', color: post.media ? accent : accent, letterSpacing: '0.08em', fontFamily: "'Space Mono',monospace", textTransform: 'uppercase', background: post.media ? `${accent}18` : 'rgba(255,255,255,0.72)', backdropFilter: 'blur(8px)', border: `1px solid ${accent}35`, borderRadius: '6px', padding: '3px 9px' }}>{post.interest.name}</div>
                </div>
                <div style={{ padding: '24px' }}>
                    {post.caption && <p style={{ fontSize: '15px', lineHeight: '1.7', color: T1, margin: '0 0 20px', fontFamily: "'DM Sans',sans-serif" }}>{post.caption}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid rgba(0,0,0,0.07)`, paddingTop: '16px' }}>
                        <span style={{ background: `${accent}14`, border: `1px solid ${accent}35`, borderRadius: '8px', padding: '7px 16px', color: accent, fontSize: '13px', fontFamily: "'DM Sans',sans-serif" }}>♥ {post._count.likes}</span>
                        <span style={{ fontSize: '11px', color: T3, fontFamily: "'Space Mono',monospace" }}>{timeSince(post.createdAt)} ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
    const init = name ? name.charAt(0).toUpperCase() : '?';
    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl
                ? <img src={avatarUrl} alt={name ?? ''} style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(88,86,214,0.2)', boxShadow: '0 4px 16px rgba(88,86,214,0.15)', display: 'block' }} />
                : <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg,#EBE4FF,#C4B5FD)', border: '2px solid rgba(88,86,214,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontFamily: "'DM Serif Display',serif", color: '#5856D6', boxShadow: '0 4px 16px rgba(88,86,214,0.15)' }}>{init}</div>
            }
            <div style={{ position: 'absolute', inset: '-5px', borderRadius: '50%', background: 'conic-gradient(from 0deg,transparent 25%,rgba(88,86,214,0.3) 50%,transparent 75%)', animation: 'spin 9s linear infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '3px', right: '3px', width: '11px', height: '11px', background: '#34C759', borderRadius: '50%', border: '2px solid white' }} />
        </div>
    );
}

// ── ProfileView ───────────────────────────────────────────────────────────────
function ProfileView({ profile, stats }: { profile: ProfileData; stats: Stats }) {
    const [modal, setModal] = useState<EnrichedPost | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

    const groups: InterestGroup[] = profile.interests.map((ui, idx) => {
        const palette = PALETTES[idx % PALETTES.length];
        const posts: EnrichedPost[] = profile.interestPosts
            .filter(p => p.interest.id === ui.interest.id)
            .map((p, pi) => ({ ...p, pattern: PATTERNS[pi % PATTERNS.length], accent: palette.accent, glow: palette.glow, gradientBg: `linear-gradient(135deg,${palette.bg[0]},${palette.bg[2]})` }));
        return { id: ui.interest.id, name: ui.interest.name, level: ui.level, palette, posts };
    });

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes heroIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
                ::-webkit-scrollbar{width:4px}
                ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:2px}
            `}</style>
            <div style={{ minHeight: '100vh', background: '#F5F5F7', color: T1, fontFamily: "'DM Sans',sans-serif", opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                {/* Ambient mesh — light tinted */}
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: `
                    radial-gradient(ellipse 700px 450px at 10% 0%,rgba(88,86,214,0.04) 0%,transparent 65%),
                    radial-gradient(ellipse 500px 400px at 90% 40%,rgba(50,173,230,0.03) 0%,transparent 65%),
                    radial-gradient(ellipse 600px 350px at 50% 100%,rgba(255,45,85,0.025) 0%,transparent 65%)`}} />

                <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 28px 80px', position: 'relative', zIndex: 1 }}>

                    {/* ── Hero ── */}
                    <div style={{ padding: '48px 0 36px', borderBottom: '1px solid rgba(0,0,0,0.08)', animation: 'heroIn 0.6s ease 0.05s both' }}>
                        <div style={{ display: 'flex', gap: '26px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <Avatar name={profile.name} avatarUrl={profile.avatarUrl} />
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                    <h1 style={{ fontSize: 'clamp(20px,4vw,30px)', fontFamily: "'DM Serif Display',serif", fontWeight: 400, letterSpacing: '-0.02em', margin: 0, color: T1 }}>{profile.name ?? 'Anonymous'}</h1>
                                </div>
                                {profile.bio && <p style={{ fontSize: '13px', lineHeight: '1.65', color: T2, maxWidth: '360px', marginBottom: '10px' }}>{profile.bio}</p>}
                                {profile.locationEnabled && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '16px' }}><span>📍</span><span style={{ fontSize: '11px', color: T3, fontFamily: "'Space Mono',monospace" }}>Location enabled</span></div>}

                                {/* Stats — iOS grouped table view */}
                                <div style={{ display: 'inline-flex', background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '18px', overflow: 'hidden' }}>
                                    {[{ l: 'Matches', v: stats.matches }, { l: 'Likes', v: stats.postLikes }, { l: 'Messages', v: stats.messagesSent }].map((s, i) => (
                                        <div key={i} style={{ padding: '12px 20px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                                            <div style={{ fontSize: '18px', fontFamily: "'DM Serif Display',serif", color: T1, marginBottom: '1px' }}>{s.v}</div>
                                            <div style={{ fontSize: '9px', color: T3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Space Mono',monospace" }}>{s.l}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Edit button — macOS native style */}
                                <a href="/me/edit" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '9px', color: T2, padding: '8px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#007AFF'; el.style.color = 'white'; el.style.borderColor = '#007AFF'; }}
                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'white'; el.style.color = T2; el.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                                >✦ Edit Profile</a>
                            </div>
                        </div>
                    </div>

                    {/* ── Interest pills ── */}
                    {profile.interests.length > 0 && (
                        <div style={{ padding: '28px 0 36px', borderBottom: '1px solid rgba(0,0,0,0.08)', animation: 'heroIn 0.6s ease 0.15s both' }}>
                            <div style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: T3, fontFamily: "'Space Mono',monospace", marginBottom: '14px' }}>Interests</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {groups.map((g, i) => (
                                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${g.palette.accent}10`, border: `1px solid ${g.palette.accent}40`, borderRadius: '100px', padding: '6px 14px', animation: `heroIn 0.4s ease ${i * 80 + 250}ms both` }}>
                                        <span style={{ color: g.palette.accent, fontSize: '13px' }}>{g.palette.icon}</span>
                                        <span style={{ fontSize: '12px', color: T1 }}>{g.name}</span>
                                        <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: g.palette.accent, fontFamily: "'Space Mono',monospace" }}>{STRENGTH_LABELS[g.level]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Carousels ── */}
                    {groups.some(g => g.posts.length > 0) && (
                        <div style={{ paddingTop: '44px', animation: 'heroIn 0.6s ease 0.3s both' }}>
                            {groups.filter(g => g.posts.length > 0).map(g => <CurvedCarousel key={g.id} group={g} onCardClick={setModal} />)}
                        </div>
                    )}
                    {!groups.some(g => g.posts.length > 0) && profile.interests.length > 0 && (
                        <div style={{ paddingTop: '60px', textAlign: 'center', animation: 'heroIn 0.6s ease 0.3s both' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.3 }}>🖼️</div>
                            <p style={{ color: T3, fontSize: '14px', marginBottom: '24px' }}>No portfolio posts yet.</p>
                            <a href="/me/edit" style={{ display: 'inline-block', padding: '9px 22px', borderRadius: '10px', background: '#007AFF', color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Add Posts →</a>
                        </div>
                    )}
                </div>
            </div>
            {modal && <Modal post={modal} onClose={() => setModal(null)} />}
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const jwt = localStorage.getItem('tribe_jwt');
        if (!jwt) { router.push('/login'); return; }
        fetch('/api/me', { headers: { Authorization: `Bearer ${jwt}` } })
            .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
            .then(d => {
                if (!d) return; if (d.error) { setError(d.error); return; }
                const p: ProfileData = { ...d.user, interestPosts: (d.user.interestPosts ?? []).map((p: PostItem) => ({ ...p, createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString() })) };
                setProfile(p); setStats(d.stats);
            })
            .catch(() => setError('Failed to load profile.'))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F7', color: T3, fontFamily: 'sans-serif' }}>Loading…</div>;
    if (error) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100vh', background: '#F5F5F7', gap: '12px', color: '#FF3B30' }}><span style={{ fontSize: '32px' }}>⚠️</span>{error}</div>;
    if (!profile || !stats) return null;
    return <ProfileView profile={profile} stats={stats} />;
}
