'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AvatarDropdown() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [initial, setInitial] = useState('?');
    const containerRef = useRef<HTMLDivElement>(null);

    // Derive initial from JWT name claim, if present
    useEffect(() => {
        try {
            const token = localStorage.getItem('tribe_jwt');
            if (!token) return;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const name: string = payload.name ?? payload.email ?? '';
            if (name) setInitial(name.charAt(0).toUpperCase());
        } catch { /* leave as '?' */ }
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener('mousedown', handler);
        return () => window.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('tribe_jwt');
        // Clear polling cookies if any
        document.cookie = 'tribe_token=; Max-Age=0; path=/';
        router.push('/login');
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {/* Avatar button */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Account menu"
                aria-expanded={open}
                style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: open ? 'var(--accent)' : 'var(--accent-soft)',
                    border: `1px solid ${open ? 'var(--accent)' : 'rgba(124,106,247,0.3)'}`,
                    color: open ? '#fff' : 'var(--accent)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                    fontFamily: 'inherit',
                    letterSpacing: '-0.01em',
                }}
            >
                {initial}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    role="menu"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '160px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '6px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        zIndex: 200,
                        // Subtle entry animation
                        animation: 'dropdown-enter 0.12s ease-out both',
                    }}
                >
                    {[
                        { label: 'Feed', href: '/feed' },
                        { label: 'Matches', href: '/matches' },
                        { label: 'Activity', href: '/activity' },
                        { label: 'Profile', href: '/me' },
                    ].map(({ label, href }) => (
                        <button
                            key={href}
                            role="menuitem"
                            onClick={() => { setOpen(false); router.push(href); }}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                border: 'none',
                                fontFamily: 'inherit',
                                transition: 'background 0.12s ease, color 0.12s ease',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget).style.background = 'rgba(255,255,255,0.05)';
                                (e.currentTarget).style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget).style.background = 'transparent';
                                (e.currentTarget).style.color = 'var(--text-secondary)';
                            }}
                        >
                            {label}
                        </button>
                    ))}

                    {/* Divider */}
                    <div style={{
                        height: '1px',
                        background: 'var(--border)',
                        margin: '4px 0',
                    }} />

                    <button
                        role="menuitem"
                        onClick={handleLogout}
                        style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: 'var(--red)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: 'none',
                            fontFamily: 'inherit',
                            transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-soft)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        Log out
                    </button>
                </div>
            )}

            <style>{`
                @keyframes dropdown-enter {
                    from { opacity: 0; transform: translateY(-4px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
