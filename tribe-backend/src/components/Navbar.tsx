'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AvatarDropdown from './AvatarDropdown';
import { T } from '../design/tokens';

import { useEffect, useState } from 'react';
import useScrollDirection from '../hooks/useScrollDirection';

const NAV_ITEMS = [
    { label: 'Discover', href: '/feed' },
    { label: 'Matches', href: '/matches' },
    { label: 'Activity', href: '/activity' },
] as const;

export default function Navbar() {
    const pathname = usePathname();
    const direction = useScrollDirection();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: '56px',
            borderBottom: scrolled ? `1px solid ${T.sep}` : '1px solid transparent',
            background: scrolled ? 'rgba(247,243,237,0.85)' : 'transparent',
            backdropFilter: scrolled ? 'blur(18px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: direction === 'down' ? 'translateY(-100%)' : 'translateY(0)',
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
