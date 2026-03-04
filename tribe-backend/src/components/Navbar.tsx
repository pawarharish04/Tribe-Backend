'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AvatarDropdown from './AvatarDropdown';
import { T } from '../design/tokens';

const NAV_ITEMS = [
    { label: 'Discover', href: '/feed' },
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
            borderBottom: `1px solid ${T.sep}`,
            background: 'rgba(247,243,237,0.95)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
        }}>
            {/* Logo */}
            <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{
                    width: '28px', height: '28px', borderRadius: '7px',
                    background: T.ink,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontFamily: "'Fraunces',Georgia,serif",
                    fontWeight: 900, color: T.cream, flexShrink: 0,
                }}>T</div>
                <span style={{
                    fontFamily: "'Fraunces',Georgia,serif",
                    fontWeight: 700, fontStyle: 'italic',
                    fontSize: '17px', letterSpacing: '-0.02em',
                    color: T.ink,
                }}>Tribe</span>
            </Link>

            {/* Nav links */}
            <nav style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {NAV_ITEMS.map(({ label, href }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link key={href} href={href} style={{
                            position: 'relative',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontFamily: 'Georgia, serif',
                            letterSpacing: '0.04em',
                            fontWeight: isActive ? 600 : 400,
                            textDecoration: 'none',
                            color: isActive ? T.ink : T.inkLight,
                            background: isActive ? T.parchment : 'transparent',
                            transition: 'color 0.15s ease, background 0.15s ease',
                            display: 'flex', alignItems: 'center',
                        }}>
                            {label}
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-1px',
                                    left: '14px', right: '14px',
                                    height: '2px',
                                    borderRadius: '2px 2px 0 0',
                                    background: T.sage,
                                }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Right slot */}
            <AvatarDropdown />
        </header>
    );
}
