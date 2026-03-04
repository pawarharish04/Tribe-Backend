'use client';

import Link from 'next/link';
import { T } from '../../design/tokens';

export interface MatchListItem {
    matchId: string;
    id: string;
    name: string;
    distanceKm: number | null;
    distanceHidden?: boolean;
    lastActiveAt: string | null;
    matchedAt: string;
    sharedInterests: string[];
}

function timeSince(dateString: string | null) {
    if (!dateString) return '';
    const sec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const d = Math.floor(sec / 86400); if (d > 0) return `${d}d`;
    const h = Math.floor(sec / 3600); if (h > 0) return `${h}h`;
    const m = Math.floor(sec / 60); if (m > 0) return `${m}m`;
    return 'now';
}

interface MatchListProps {
    matches: MatchListItem[];
    activeId?: string;
}

export default function MatchList({ matches, activeId }: MatchListProps) {
    if (matches.length === 0) {
        return (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: T.inkFaint, fontSize: '13px', lineHeight: 1.6, fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.5 }}>◎</div>
                No matches yet.<br />Keep discovering.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {matches.map(match => {
                const isActive = match.matchId === activeId;
                const isOnline = match.lastActiveAt &&
                    (Date.now() - new Date(match.lastActiveAt).getTime() < 3600000);
                const initial = match.name ? match.name.charAt(0).toUpperCase() : '?';

                return (
                    <Link key={match.matchId} href={`/matches/${match.matchId}`} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', textDecoration: 'none', position: 'relative',
                        borderLeft: isActive ? `2px solid ${T.sage}` : `2px solid transparent`,
                        background: isActive ? T.sageSoft : 'transparent',
                        transition: 'background 0.15s ease, border-color 0.15s ease',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${T.sep}`,
                    }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.parchment; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                            background: isActive ? T.sage : T.parchment,
                            border: `1.5px solid ${isActive ? T.sage : T.sep}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontFamily: "'Fraunces',Georgia,serif",
                            fontWeight: 700, color: isActive ? T.cream : T.inkMid, position: 'relative',
                        }}>
                            {initial}
                            {isOnline && (
                                <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '8px', height: '8px', borderRadius: '50%', background: T.sage, border: `1.5px solid ${T.cream}` }} />
                            )}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '13px', fontWeight: isActive ? 600 : 500,
                                fontFamily: "'Cormorant Garamond',Georgia,serif",
                                color: isActive ? T.ink : T.inkMid,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{match.name}</div>
                            {match.sharedInterests.length > 0 && (
                                <div style={{ fontSize: '11px', color: T.inkFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                    {match.sharedInterests.slice(0, 2).join(' · ')}
                                </div>
                            )}
                        </div>

                        {/* Time */}
                        <div style={{ fontSize: '10px', color: T.inkFaint, flexShrink: 0, fontFamily: 'Georgia,serif', letterSpacing: '0.04em' }}>
                            {timeSince(match.matchedAt)}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
