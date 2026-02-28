'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AvatarDropdown from './AvatarDropdown';

const NAV_ITEMS = [
    { label: 'Feed', href: '/feed' },
    { label: 'Matches', href: '/matches' },
    { label: 'Activity', href: '/activity' },
] as const;

export default function Navbar() {
    const pathname = usePathname();

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: '56px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(12,12,14,0.92)',
            backdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
        }}>
            {/* Logo */}
            <Link
                href="/feed"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                }}
            >
                <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                }}>
                    T
                </div>
                <span style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                }}>
                    Tribe
                </span>
            </Link>

            {/* Nav links */}
            <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {NAV_ITEMS.map(({ label, href }) => {
                    // Active: exact match, or startsWith for nested routes like /matches/[id]
                    const isActive = pathname === href || pathname.startsWith(href + '/');

                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                position: 'relative',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: isActive ? 600 : 500,
                                textDecoration: 'none',
                                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--accent-soft)' : 'transparent',
                                transition: 'color 0.15s ease, background 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {label}
                            {/* Active underline indicator */}
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-1px',       // flush with header border
                                    left: '14px',
                                    right: '14px',
                                    height: '2px',
                                    borderRadius: '2px 2px 0 0',
                                    background: 'var(--accent)',
                                }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Right slot: avatar / dropdown */}
            <AvatarDropdown />
        </header>
    );
}
