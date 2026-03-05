"use client"

import Link from "next/link"

export default function CreatorCard({ creator }: any) {
    return (
        <Link
            href={`/profile/${creator.id || creator.userId}`}
            style={{
                minWidth: '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit'
            }}
        >
            <img
                src={creator.avatarUrl || creator.avatar || "/avatar.png"}
                onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + (creator.displayName || creator.name || 'U') + '&background=E8E0D4&color=1C1917'; }}
                style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--border)',
                    padding: '2px',
                    background: 'var(--bg-card)'
                }}
                alt={creator.name || creator.displayName}
            />

            <p style={{
                fontSize: '14px',
                marginTop: '10px',
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 600,
                textAlign: 'center',
                lineHeight: 1.2
            }}>
                {creator.name || creator.displayName}
            </p>

            {creator.compatibilityScore && (
                <span style={{
                    fontSize: '11px',
                    opacity: 0.6,
                    marginTop: '4px',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    {Math.round(creator.compatibilityScore)}% match
                </span>
            )}
            {creator.score && !creator.compatibilityScore && (
                <span style={{
                    fontSize: '11px',
                    opacity: 0.6,
                    marginTop: '4px',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    {Math.round(creator.score)}% match
                </span>
            )}
        </Link>
    )
}
