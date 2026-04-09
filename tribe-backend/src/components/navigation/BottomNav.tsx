'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
    {
        href: '/feed',
        label: 'Discover',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6" strokeWidth={active ? 2.5 : 1.8}/>
            </svg>
        ),
    },
    {
        href: '/rooms',
        label: 'Rooms',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        ),
    },
    {
        href: '/matches',
        label: 'Matches',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'url(#heartGrad)' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6"/>
                        <stop offset="100%" stopColor="#ec4899"/>
                    </linearGradient>
                </defs>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        ),
    },
    {
        href: '/me',
        label: 'Profile',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
        ),
    },
] as const;

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <>
            {/* Spacer so content doesn't hide behind nav */}
            <div style={{ height: '84px' }} />

            <nav style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 200,
                background: 'rgba(10,10,15,0.85)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderTop: '1px solid rgba(255,255,255,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                height: '72px',
                padding: '0 8px',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}>
                {TABS.map(({ href, label, icon }) => {
                    const active = pathname === href || (href !== '/feed' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 16px',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                color: active ? 'transparent' : 'rgba(248,250,252,0.38)',
                                background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                                position: 'relative',
                                minWidth: '64px',
                            }}
                        >
                            {/* Icon with gradient when active */}
                            <span style={{
                                background: active ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'none',
                                WebkitBackgroundClip: active ? 'text' : 'unset',
                                backgroundClip: active ? 'text' : 'unset',
                                WebkitTextFillColor: active ? 'transparent' : 'rgba(248,250,252,0.38)',
                                color: active ? 'transparent' : 'rgba(248,250,252,0.38)',
                                display: 'flex',
                                filter: active ? 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' : 'none',
                                transition: 'filter 0.3s',
                            }}>
                                {icon(active)}
                            </span>

                            {/* Label */}
                            <span style={{
                                fontSize: '10px',
                                fontWeight: active ? 600 : 400,
                                fontFamily: 'Inter, sans-serif',
                                letterSpacing: '0.02em',
                                background: active ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'none',
                                WebkitBackgroundClip: active ? 'text' : 'unset',
                                backgroundClip: active ? 'text' : 'unset',
                                WebkitTextFillColor: active ? 'transparent' : 'rgba(248,250,252,0.38)',
                                color: active ? 'transparent' : 'rgba(248,250,252,0.38)',
                            }}>
                                {label}
                            </span>

                            {/* Active glow dot */}
                            {active && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '4px', height: '4px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                                    boxShadow: '0 0 8px rgba(139,92,246,0.8)',
                                }} />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
