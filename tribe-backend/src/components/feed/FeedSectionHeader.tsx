"use client"

import Link from "next/link"

export default function FeedSectionHeader({ title, link }: { title: string, link: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 20px' }}>
            <h2 style={{ fontSize: '20px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{title}</h2>

            <Link
                href={link}
                style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--inkMid)', textDecoration: 'none', transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--inkMid)'}
            >
                Explore →
            </Link>
        </div>
    )
}
