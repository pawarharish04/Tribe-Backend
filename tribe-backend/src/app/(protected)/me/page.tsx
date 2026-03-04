'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ProfileData, type Stats, type PostItem, type UserInterestItem } from '../../../components/profile/ProfileEditor';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    cream: '#F7F3ED', cream2: '#EFE9E0', parchment: '#E8E0D4',
    ink: '#1C1917', inkMid: '#44403C', inkLight: '#78716C', inkFaint: '#A8A29E', sep: '#D6CFC6',
    sage: '#5C7A5F', clay: '#B85C38', indigo: '#3D4F7C', gold: '#A07840',
    sageSoft: '#EDF2ED', claySoft: '#FBF0EC', indigoSoft: '#EDF0F7', goldSoft: '#F7F0E6',
};

const PALETTES = [
    { accent: T.sage, soft: T.sageSoft, cardTints: ['#EEF3EE', '#E6EDE7', '#DCE7DD'] as const, icon: '◉', kanji: '彩', number: '01' },
    { accent: T.clay, soft: T.claySoft, cardTints: ['#FBF2EE', '#F5E8E0', '#EEDDD4'] as const, icon: '◧', kanji: '造', number: '02' },
    { accent: T.indigo, soft: T.indigoSoft, cardTints: ['#EEF0F7', '#E5E9F3', '#DADEEE'] as const, icon: '◌', kanji: '楽', number: '03' },
    { accent: T.gold, soft: T.goldSoft, cardTints: ['#F7F1E8', '#F0E8DA', '#E8DDCB'] as const, icon: '◈', kanji: '旅', number: '04' },
    { accent: '#6B5B95', soft: '#F3F0F8', cardTints: ['#F3F0F8', '#EAE6F3', '#DDDAEE'] as const, icon: '⬡', kanji: '心', number: '05' },
    { accent: '#6B8E6B', soft: '#EFF4EF', cardTints: ['#EFF4EF', '#E6EFE6', '#DAEADA'] as const, icon: '◇', kanji: '動', number: '06' },
] as const;

const PATTERNS = ['rings', 'lines', 'dots', 'grid', 'cross', 'waves', 'geo'];
const STR_LABELS: Record<number, string> = { 1: 'Curious', 2: 'Serious', 3: 'Core' };

function timeSince(d: string) {
    const ms = Date.now() - new Date(d).getTime();
    const days = Math.floor(ms / 86400000);
    if (days >= 7) return `${Math.floor(days / 7)}w`;
    if (days > 0) return `${days}d`;
    const h = Math.floor(ms / 3600000); if (h > 0) return `${h}h`;
    return `${Math.floor(ms / 60000)}m`;
}

type Pal = (typeof PALETTES)[number];
type RichPost = PostItem & { pattern: string; accent: string; soft: string; cardTints: readonly [string, string, string] };
type Group = { id: string; name: string; level: number; pal: Pal; posts: RichPost[] };

// ── SVG Patterns ──────────────────────────────────────────────────────────────
function Pat({ type, color }: { type: string; color: string }) {
    const s: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 };
    if (type === 'rings') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{[18, 42, 68, 96, 126].map((r, i) => <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="1" />)}</svg>;
    if (type === 'lines') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 10 }, (_, i) => <line key={i} x1={i * 22} y1="0" x2={i * 22 + 55} y2="200" stroke={color} strokeWidth="1.1" />)}</svg>;
    if (type === 'dots') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i % 6) * 36 + 8} cy={Math.floor(i / 6) * 36 + 8} r="2.5" fill={color} />)}</svg>;
    if (type === 'grid') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 6 }, (_, i) => [<line key={`h${i}`} x1="0" y1={i * 40} x2="200" y2={i * 40} stroke={color} strokeWidth="0.8" />, <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="200" stroke={color} strokeWidth="0.8" />])}</svg>;
    if (type === 'cross') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 16 }, (_, i) => { const x = (i % 4) * 50 + 25, y = Math.floor(i / 4) * 50 + 25; return <g key={i}><line x1={x - 7} y1={y} x2={x + 7} y2={y} stroke={color} strokeWidth="1" /><line x1={x} y1={y - 7} x2={x} y2={y + 7} stroke={color} strokeWidth="1" /></g>; })}</svg>;
    if (type === 'waves') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">{[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M0,${46 + i * 26} Q50,${30 + i * 26} 100,${46 + i * 26} T200,${46 + i * 26}`} fill="none" stroke={color} strokeWidth="1.4" />)}</svg>;
    if (type === 'geo') return <svg style={s} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><polygon points="100,12 188,78 156,178 44,178 12,78" fill="none" stroke={color} strokeWidth="1.2" /><polygon points="100,40 164,94 140,162 60,162 36,94" fill="none" stroke={color} strokeWidth="0.7" /><circle cx="100" cy="100" r="18" fill="none" stroke={color} strokeWidth="0.8" /></svg>;
    return null;
}

// ── Arc Carousel ──────────────────────────────────────────────────────────────
function ArcCarousel({ group, onOpen }: { group: Group; onOpen: (p: RichPost) => void }) {
    const { posts, pal } = group;
    const { accent, soft, cardTints, icon, kanji, number } = pal;
    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [dragX0, setDragX0] = useState(0); const [off0, setOff0] = useState(0);
    const [hov, setHov] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null); const rafR = useRef(0);
    const vel = useRef(0); const lx = useRef(0); const lt = useRef(0);
    const [cw, setCw] = useState(880);
    const CW = 210, CH = 255, STEP = CW + 20, MAX = posts.length - 1;

    useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(e => setCw(e[0].contentRect.width)); ro.observe(el); return () => ro.disconnect(); }, []);

    function arc(idx: number, sc: number) { const rel = idx - sc; const x = rel * STEP * 0.76; const k = 0.013; const y = k * x * x; const rz = -Math.atan(2 * k * x) * (180 / Math.PI) * 0.6; const d = Math.abs(rel); return { x, y, rz, sc: Math.max(0.70, 1 - d * 0.07), z: -d * 32, op: Math.max(0.25, 1 - d * 0.18) }; }

    const momentum = useCallback(() => { cancelAnimationFrame(rafR.current); const go = () => { vel.current *= 0.90; if (Math.abs(vel.current) < 0.001) return; setOffset(o => Math.max(0, Math.min(MAX, o + vel.current))); rafR.current = requestAnimationFrame(go); }; rafR.current = requestAnimationFrame(go); }, [MAX]);
    const pd = (e: React.PointerEvent) => { cancelAnimationFrame(rafR.current); setDragging(true); setDragX0(e.clientX); setOff0(offset); lx.current = e.clientX; lt.current = Date.now(); vel.current = 0; e.currentTarget.setPointerCapture(e.pointerId); };
    const pm = (e: React.PointerEvent) => { if (!dragging) return; const now = Date.now(); vel.current = -((e.clientX - lx.current) / Math.max(1, now - lt.current)) * 0.19; lx.current = e.clientX; lt.current = now; setOffset(Math.max(0, Math.min(MAX, off0 - (e.clientX - dragX0) / STEP))); };
    const pu = () => { setDragging(false); momentum(); };
    const go = (d: number) => { cancelAnimationFrame(rafR.current); setOffset(o => Math.max(0, Math.min(MAX, Math.round(o) + d))); };
    const cx = cw / 2;

    return (
        <div style={{ marginBottom: '60px' }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px' }}>
                    <span style={{ fontSize: '42px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, color: T.parchment, lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none', textShadow: `1px 1px 0 ${T.sep}` }}>{number}</span>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px', color: accent }}>{icon}</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: T.ink, letterSpacing: '-0.025em', fontFamily: "'Fraunces',Georgia,serif" }}>{group.name}</span>
                            <span style={{ fontSize: '11px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, fontStyle: 'italic' }}>{kanji}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, background: soft, border: `1px solid ${accent}35`, borderRadius: '4px', padding: '2px 7px' }}>{STR_LABELS[group.level]}</span>
                            <span style={{ fontSize: '11px', color: T.inkFaint }}>{posts.length} works</span>
                        </div>
                    </div>
                </div>
                {posts.length > 1 && <div style={{ display: 'flex', gap: '6px' }}>
                    {([-1, 1] as const).map(d => (
                        <button key={d} onClick={() => go(d)} style={{ width: '34px', height: '34px', background: 'transparent', border: `1.5px solid ${T.sep}`, borderRadius: '50%', color: T.inkLight, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = accent; el.style.color = accent; el.style.background = soft; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.sep; el.style.color = T.inkLight; el.style.background = 'transparent'; }}
                        >{d === -1 ? '←' : '→'}</button>
                    ))}
                </div>}
            </div>

            {/* Stage */}
            <div ref={ref} onPointerDown={pd} onPointerMove={pm} onPointerUp={pu} onPointerCancel={pu}
                style={{ position: 'relative', height: `${CH + 85}px`, overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${cw} ${CH + 85}`} preserveAspectRatio="none">
                    <defs><linearGradient id={`ag${group.id}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={accent} stopOpacity="0" /><stop offset="25%" stopColor={accent} stopOpacity="0.2" /><stop offset="50%" stopColor={accent} stopOpacity="0.45" /><stop offset="75%" stopColor={accent} stopOpacity="0.2" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
                    {[{ y: 20, w: 1.8, op: 0.85 }, { y: 32, w: 0.8, op: 0.4 }].map((r, ri) => {
                        const drop = 0.013 * (cx * 1.5) ** 2 * 0.32;
                        return <path key={ri} d={`M0,${r.y + drop} Q${cx},${r.y} ${cw},${r.y + drop}`} fill="none" stroke={`url(#ag${group.id})`} strokeWidth={r.w} opacity={r.op} />;
                    })}
                </svg>

                {posts.map((post, i) => {
                    const { x, y, rz, sc, z, op } = arc(i, offset);
                    const sx = cx + x - CW / 2; const sy = 32 + y;
                    const isC = Math.abs(i - offset) < 0.55; const isH = hov === post.id;
                    const tint = cardTints[i % cardTints.length];
                    return (
                        <div key={post.id} onMouseEnter={() => setHov(post.id)} onMouseLeave={() => setHov(null)}
                            onClick={() => { if (!dragging) onOpen(post); }}
                            style={{
                                position: 'absolute', left: `${sx}px`, top: `${sy}px`, width: `${CW}px`, height: `${CH}px`,
                                transform: `perspective(1000px) translateZ(${z + (isH ? 22 : 0)}px) rotate(${rz}deg) scale(${sc * (isH ? 1.06 : 1)})`,
                                transformOrigin: 'center bottom', opacity: op,
                                transition: dragging ? 'none' : 'transform 0.44s cubic-bezier(0.34,1.45,0.64,1),opacity 0.3s,box-shadow 0.28s',
                                cursor: 'pointer', zIndex: Math.round(sc * 10), borderRadius: '16px',
                                background: post.media ? '#fff' : `linear-gradient(155deg,${cardTints[0]},${tint})`,
                                border: `1px solid ${isC || isH ? accent + '50' : T.sep}`,
                                boxShadow: isH ? `0 24px 50px rgba(28,25,23,0.14),0 0 0 1.5px ${accent}45` : isC ? `0 14px 36px rgba(28,25,23,0.10),0 2px 8px rgba(28,25,23,0.06)` : `0 4px 14px rgba(28,25,23,0.07)`,
                                overflow: 'hidden'
                            }}>
                            {post.media ? (
                                post.media.type === 'video'
                                    ? <video src={post.media.url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                    : <img src={post.media.url} alt={post.caption ?? ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : <Pat type={post.pattern} color={accent} />}
                            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 70% 10%,${accent}14 0%,transparent 55%)`, pointerEvents: 'none' }} />
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px',
                                background: post.media ? 'linear-gradient(to top,rgba(28,25,23,0.68) 0%,transparent 70%)' : `linear-gradient(to top,${cardTints[0]}f8 0%,${cardTints[0]}88 50%,transparent 100%)`
                            }}>
                                <p style={{ fontSize: '11.5px', lineHeight: '1.55', color: post.media ? 'rgba(247,243,237,0.9)' : T.inkMid, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '34px' }}>
                                    {post.caption ?? '—'}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', color: post.media ? 'rgba(247,243,237,0.7)' : accent, background: post.media ? 'rgba(28,25,23,0.35)' : soft, borderRadius: '20px', padding: '2px 8px' }}>♥ {post._count.likes}</span>
                                    <span style={{ fontSize: '10px', color: post.media ? 'rgba(247,243,237,0.5)' : T.inkFaint }}>{timeSince(post.createdAt)}</span>
                                </div>
                            </div>
                            {isC && <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', boxShadow: `inset 0 0 0 1.5px ${accent}60`, pointerEvents: 'none' }} />}
                        </div>
                    );
                })}
                {(['left', 'right'] as const).map(s => (
                    <div key={s} style={{ position: 'absolute', top: 0, bottom: 0, [s]: 0, width: '90px', background: `linear-gradient(to ${s === 'left' ? 'right' : 'left'},${T.cream} 0%,transparent 100%)`, pointerEvents: 'none', zIndex: 20 }} />
                ))}
            </div>
            {posts.length > 1 && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {posts.map((_, i) => { const act = Math.abs(i - offset) < 0.5; return <div key={i} onClick={() => setOffset(i)} style={{ width: act ? '20px' : '5px', height: '5px', borderRadius: '3px', background: act ? accent : T.parchment, border: act ? 'none' : `1px solid ${T.sep}`, cursor: 'pointer', transition: 'all 0.32s cubic-bezier(0.34,1.4,0.64,1)' }} />; })}
            </div>}
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ post, onClose }: { post: RichPost; onClose: () => void }) {
    useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; }; }, [onClose]);
    const { accent, soft, cardTints, pattern } = post;
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(32px) saturate(1.2)', WebkitBackdropFilter: 'blur(32px) saturate(1.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fIn 0.2s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: cardTints[0], borderRadius: '24px', overflow: 'hidden', border: `1px solid ${accent}35`, boxShadow: '0 48px 96px rgba(28,25,23,0.22),0 0 0 0.5px rgba(28,25,23,0.08)', animation: 'sUp 0.32s cubic-bezier(0.34,1.5,0.64,1)' }}>
                {post.media ? (
                    post.media.type === 'video'
                        ? <video src={post.media.url} style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', background: '#1c1917', display: 'block' }} controls autoPlay muted />
                        : <img src={post.media.url} alt={post.caption ?? ''} style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', background: cardTints[1], display: 'block' }} />
                ) : (
                    <div style={{ height: '240px', background: `linear-gradient(145deg,${cardTints[0]},${cardTints[2]})`, position: 'relative', overflow: 'hidden' }}>
                        <Pat type={pattern} color={accent} />
                        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 35% 25%,${accent}20 0%,transparent 60%)` }} />
                    </div>
                )}
                <div style={{ position: 'relative' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '-52px', right: '14px', background: `rgba(247,243,237,0.82)`, backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: T.inkLight, cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 8px rgba(28,25,23,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ fontSize: '9px', color: accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontStyle: 'italic', fontFamily: 'Georgia,serif', marginBottom: '6px' }}>{post.interest.name}</div>
                    {post.caption && <p style={{ fontSize: '15px', lineHeight: '1.72', color: T.inkMid, margin: '0 0 20px', fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{post.caption}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.sep}`, paddingTop: '16px' }}>
                        <span style={{ background: soft, border: `1px solid ${accent}40`, borderRadius: '8px', padding: '7px 16px', color: accent, fontSize: '12px', fontWeight: 600 }}>♥ {post._count.likes}</span>
                        <span style={{ fontSize: '11px', color: T.inkFaint, fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic' }}>{timeSince(post.createdAt)} ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Profile View ──────────────────────────────────────────────────────────────
function ProfileView({ profile, stats }: { profile: ProfileData; stats: Stats }) {
    const [modal, setModal] = useState<RichPost | null>(null);
    const [ready, setReady] = useState(false);
    useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

    const initials = profile.name ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??';

    const groups: Group[] = profile.interests.map((ui, idx) => {
        const pal = PALETTES[idx % PALETTES.length];
        const posts: RichPost[] = profile.interestPosts
            .filter(p => p.interest.id === ui.interest.id)
            .map((p, pi) => ({ ...p, pattern: PATTERNS[pi % PATTERNS.length], accent: pal.accent, soft: pal.soft, cardTints: pal.cardTints }));
        return { id: ui.interest.id, name: ui.interest.name, level: ui.level, pal, posts };
    });

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Fraunces:ital,wght@0,700;0,900;1,300;1,400&display=swap');
                *{box-sizing:border-box;}
                html,body{background:${T.cream};-webkit-font-smoothing:antialiased;}
                @keyframes fIn{from{opacity:0}to{opacity:1}}
                @keyframes sUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
                @keyframes rIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
                ::-webkit-scrollbar{width:3px;}
                ::-webkit-scrollbar-thumb{background:${T.parchment};border-radius:2px;}
            `}</style>
            <div style={{ minHeight: '100vh', background: T.cream, color: T.ink, fontFamily: "'Cormorant Garamond',Georgia,serif", opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}>

                {/* ── Nav bar ── */}
                <div style={{ borderBottom: `1px solid ${T.sep}`, padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.cream, animation: 'rIn 0.5s ease 0s both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: T.cream, fontFamily: 'Georgia,serif' }}>{initials.charAt(0)}</div>
                        <span style={{ fontSize: '12px', color: T.inkLight, letterSpacing: '0.04em', fontFamily: 'Georgia,serif' }}>{profile.name ?? 'Profile'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {['Edit Profile', 'Settings'].map((l, i) => (
                            <a key={i} href={i === 0 ? '/me/edit' : '#'} style={{ padding: '6px 16px', borderRadius: '20px', background: i === 0 ? T.ink : 'transparent', border: i === 0 ? 'none' : `1px solid ${T.sep}`, color: i === 0 ? T.cream : T.inkMid, fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia,serif', textDecoration: 'none', display: 'inline-block', transition: 'all 0.18s' }}
                                onMouseEnter={e => { if (i === 1) { (e.currentTarget as HTMLElement).style.borderColor = T.ink; (e.currentTarget as HTMLElement).style.color = T.ink; } }}
                                onMouseLeave={e => { if (i === 1) { (e.currentTarget as HTMLElement).style.borderColor = T.sep; (e.currentTarget as HTMLElement).style.color = T.inkMid; } }}
                            >{l}</a>
                        ))}
                    </div>
                </div>

                <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 40px 100px' }}>

                    {/* ── Hero ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderBottom: `1px solid ${T.sep}`, padding: '56px 0 48px', animation: 'rIn 0.5s ease 0.08s both' }}>
                        {/* Left: Identity */}
                        <div style={{ paddingRight: '48px', borderRight: `1px solid ${T.sep}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    {profile.avatarUrl
                                        ? <img src={profile.avatarUrl} alt={profile.name ?? ''} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${T.sep}`, boxShadow: '0 4px 16px rgba(28,25,23,0.1)', display: 'block' }} />
                                        : <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(145deg,${T.parchment},${T.cream2})`, border: `1.5px solid ${T.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, color: T.ink, boxShadow: '0 4px 16px rgba(28,25,23,0.10)' }}>{initials}</div>
                                    }
                                    <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '11px', height: '11px', background: T.sage, borderRadius: '50%', border: `2px solid ${T.cream}` }} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '28px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.ink, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '3px' }}>{profile.name ?? 'Anonymous'}</h1>
                                    {profile.locationEnabled && <div style={{ fontSize: '12px', color: T.inkLight, letterSpacing: '0.02em' }}>📍 Location enabled</div>}
                                </div>
                            </div>
                            {profile.bio && <p style={{ fontSize: '15.5px', lineHeight: '1.75', color: T.inkMid, fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', marginBottom: '22px', maxWidth: '340px' }}>"{profile.bio}"</p>}
                        </div>

                        {/* Right: Stats + interests */}
                        <div style={{ paddingLeft: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', gap: '32px', marginBottom: '28px' }}>
                                {[{ l: 'Matches', v: stats.matches }, { l: 'Likes', v: stats.postLikes }, { l: 'Messages', v: stats.messagesSent }].map((s, i) => (
                                    <div key={i}>
                                        <div style={{ fontSize: '36px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, color: T.ink, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '3px' }}>{s.v}</div>
                                        <div style={{ fontSize: '10px', color: T.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia,serif' }}>{s.l}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkFaint, marginBottom: '10px', fontFamily: 'Georgia,serif' }}>Interests</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                    {groups.map((g, i) => (
                                        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: g.pal.soft, border: `1px solid ${g.pal.accent}40`, borderRadius: '6px', padding: '5px 11px' }}>
                                            <span style={{ color: g.pal.accent, fontSize: '12px' }}>{g.pal.icon}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: T.inkMid, fontFamily: 'Georgia,serif' }}>{g.name}</span>
                                            <span style={{ fontSize: '8px', color: g.pal.accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{STR_LABELS[g.level]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '36px 0 32px', animation: 'rIn 0.5s ease 0.18s both' }}>
                        <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: T.inkFaint, whiteSpace: 'nowrap', fontFamily: 'Georgia,serif' }}>Works & Interests</div>
                        <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right,${T.sep},transparent)` }} />
                        <div style={{ fontSize: '11px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', color: T.inkFaint }}>Drag to explore</div>
                    </div>

                    {/* Carousels */}
                    <div style={{ animation: 'rIn 0.5s ease 0.26s both' }}>
                        {groups.filter(g => g.posts.length > 0).map(g => <ArcCarousel key={g.id} group={g} onOpen={setModal} />)}
                    </div>

                    {groups.every(g => g.posts.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <p style={{ fontSize: '15px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', color: T.inkFaint, marginBottom: '24px' }}>No works published yet.</p>
                            <a href="/me/edit" style={{ display: 'inline-block', padding: '9px 22px', borderRadius: '8px', background: T.ink, color: T.cream, fontSize: '12px', fontWeight: 600, textDecoration: 'none', fontFamily: 'Georgia,serif' }}>Add Works →</a>
                        </div>
                    )}

                    {/* Colophon */}
                    <div style={{ borderTop: `1px solid ${T.sep}`, paddingTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
                        <span style={{ fontSize: '11px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', color: T.inkLight }}>Tribe — profile</span>
                        <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: 'Georgia,serif' }}>2026</span>
                    </div>
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
                setProfile({ ...d.user, interestPosts: (d.user.interestPosts ?? []).map((p: PostItem) => ({ ...p, createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString() })) });
                setStats(d.stats);
            })
            .catch(() => setError('Failed to load.'))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.cream, color: T.inkFaint, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '16px', fontStyle: 'italic' }}>Loading…</div>;
    if (error) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.cream, color: T.clay, fontFamily: 'Georgia,serif', fontSize: '14px' }}>{error}</div>;
    if (!profile || !stats) return null;
    return <ProfileView profile={profile} stats={stats} />;
}
