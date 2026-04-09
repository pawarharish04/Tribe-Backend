'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AvatarDropdown from './AvatarDropdown';

const NAV_ITEMS = [
    { label: 'Discover', href: '/feed' },
    { label: 'Matches', href: '/matches' },
    { label: 'Activity', href: '/activity' },
] as const;

/** Desktop-only top navbar — hidden on mobile (handled by BottomNav) */
export default function Navbar() {
    const pathname = usePathname();

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: '60px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(10,10,15,0.80)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
        }}>
            {/* Logo */}
            <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{
                    width: '30px', height: '30px', borderRadius: '9px',
                    background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontFamily: 'Inter, sans-serif',
                    fontWeight: 800, color: '#fff', flexShrink: 0,
                    boxShadow: '0 0 16px rgba(139,92,246,0.4)',
                }}>T</div>
                <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800, fontSize: '17px',
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>Tribe</span>
            </Link>

            {/* Nav links */}
            <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {NAV_ITEMS.map(({ label, href }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link key={href} href={href} style={{
                            position: 'relative',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: isActive ? 600 : 400,
                            textDecoration: 'none',
                            color: isActive ? '#a78bfa' : 'rgba(248,250,252,0.50)',
                            background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                            transition: 'all 0.2s',
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
                                    background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
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
