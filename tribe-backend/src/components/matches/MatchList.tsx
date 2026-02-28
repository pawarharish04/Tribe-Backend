'use client';

import Link from 'next/link';

export interface MatchListItem {
    matchId: string;
    id: string;          // partner userId
    name: string;
    lastActiveAt: string | null;
    matchedAt: string;
    sharedInterests: string[];
}

function timeSince(dateString: string | null) {
    if (!dateString) return '';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const d = Math.floor(seconds / 86400);
    if (d > 0) return `${d}d`;
    const h = Math.floor(seconds / 3600);
    if (h > 0) return `${h}h`;
    const m = Math.floor(seconds / 60);
    if (m > 0) return `${m}m`;
    return 'now';
}

interface MatchListProps {
    matches: MatchListItem[];
    activeId?: string;   // matchId of the currently open chat
}

export default function MatchList({ matches, activeId }: MatchListProps) {
    if (matches.length === 0) {
        return (
            <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
                lineHeight: 1.6,
            }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔓</div>
                No matches yet.<br />
                Keep discovering.
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
                    <Link
                        key={match.matchId}
                        href={`/matches/${match.matchId}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            textDecoration: 'none',
                            position: 'relative',
                            // Active: left border accent + darker bg
                            borderLeft: isActive
                                ? '2px solid var(--accent)'
                                : '2px solid transparent',
                            background: isActive
                                ? 'rgba(124,106,247,0.08)'
                                : 'transparent',
                            transition: 'background 0.15s ease, border-color 0.15s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: isActive ? 'var(--accent)' : 'var(--accent-soft)',
                            border: `1px solid ${isActive ? 'var(--accent)' : 'rgba(124,106,247,0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: isActive ? '#fff' : 'var(--accent)',
                            position: 'relative',
                        }}>
                            {initial}
                            {/* Online dot */}
                            {isOnline && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '1px',
                                    right: '1px',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'var(--gold)',
                                    border: '1.5px solid var(--bg)',
                                }} />
                            )}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                letterSpacing: '-0.01em',
                            }}>
                                {match.name}
                            </div>
                            {match.sharedInterests.length > 0 && (
                                <div style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    marginTop: '1px',
                                }}>
                                    {match.sharedInterests.slice(0, 2).join(', ')}
                                </div>
                            )}
                        </div>

                        {/* Time */}
                        <div style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                            letterSpacing: '0.02em',
                        }}>
                            {timeSince(match.matchedAt)}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
