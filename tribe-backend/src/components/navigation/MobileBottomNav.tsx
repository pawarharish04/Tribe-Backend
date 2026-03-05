'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Compass, Heart, MessageCircle, User } from 'lucide-react';
import { TOKENS } from '../../styles/designTokens';

export function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    if (!pathname?.startsWith('/')) return null;

    // Hide on login/onboarding
    const hideOn = ['/login', '/register', '/onboarding'];
    if (hideOn.some(p => pathname.startsWith(p))) return null;

    const tabs = [
        { label: 'Discover', path: '/feed', icon: Compass },
        { label: 'Matches', path: '/matches', icon: Heart },
        { label: 'Chat', path: '/activity', icon: MessageCircle }, // Or matches list
        { label: 'Profile', path: '/me', icon: User },
    ];

    return (
        <div className="mobile-bottom-nav">
            <nav style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                height: '64px',
                width: '100%',
                background: 'rgba(247,243,237,0.9)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderTop: `1px solid ${TOKENS.colors.sep}`,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
            }}>
                {tabs.map((tab) => {
                    // Make it match sub-routes, like /matches/[id] except maybe chat handles its own visibility, but we are supposed to show it always
                    const isActive = pathname.startsWith(tab.path);
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.path}
                            onClick={() => router.push(tab.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                minWidth: '44px',
                                minHeight: '44px',
                                background: 'transparent',
                                border: 'none',
                                color: isActive ? TOKENS.colors.sage : TOKENS.colors.inkFaint,
                                gap: '4px',
                                transition: 'color 0.2s',
                                cursor: 'pointer',
                            }}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span style={{
                                fontSize: '10px',
                                fontFamily: TOKENS.typography.label.fontFamily,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                fontWeight: isActive ? 600 : 400,
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <style jsx>{`
                .mobile-bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 64px;
                    z-index: 1000;
                    padding-bottom: env(safe-area-inset-bottom);
                    background: ${TOKENS.colors.cream};
                }

                @media (min-width: 640px) {
                    .mobile-bottom-nav {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
