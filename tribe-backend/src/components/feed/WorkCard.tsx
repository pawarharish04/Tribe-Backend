"use client"
import { useState } from 'react';

export default function WorkCard({ post }: any) {
    const [isHovered, setIsHovered] = useState(false);
    // Try to use actual media URL if available, fallback to un-found generic
    const mediaUrl = post.mediaUrl || (post.media && post.media.url) || 'https://source.unsplash.com/random/300x300';
    const type = post.mediaType || (post.media && post.media.type) || 'image';
    const likesCount = post.likes || (post._count && post._count.likes) || 0;

    return (
        <div style={{
            minWidth: '220px',
            maxWidth: '220px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'var(--transition)'
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; setIsHovered(true); }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; setIsHovered(false); }}
        >
            <div style={{ position: 'relative', width: '100%', height: '220px' }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(28, 25, 23, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    zIndex: 10
                }}>
                    <span style={{ color: '#fff', fontSize: '18px', fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        ♥ {likesCount}
                    </span>
                </div>
                {type === 'video' ? (
                    <video
                        src={mediaUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        autoPlay loop muted playsInline
                    />
                ) : (
                    <img
                        src={mediaUrl}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={post.caption || 'Post media'}
                        onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect x="0" y="0" width="300" height="300" fill="%23E8E0D4"/><text x="50%" y="50%" fill="%23A8A29E" text-anchor="middle" dy=".3em" font-family="Georgia,serif">Media</text></svg>'; }}
                    />
                )}
            </div>

            <div style={{ padding: '12px 16px' }}>
                <p style={{
                    fontSize: '14px',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4
                }}>
                    {post.caption || 'Untitled work'}
                </p>
            </div>
        </div>
    )
}
