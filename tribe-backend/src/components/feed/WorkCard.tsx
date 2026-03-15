"use client"
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkCard({ post }: any) {
    const [isHovered, setIsHovered] = useState(false);
    const [heart, setHeart] = useState<{ x: number, y: number, id: number } | null>(null);
    const initialLikes = post.likes !== undefined ? post.likes : (post._count && post._count.likes) || 0;
    const [likesCount, setLikesCount] = useState({ count: initialLikes, liked: false });

    // Try to use actual media URL if available, fallback to un-found generic
    const mediaUrl = post.mediaUrl || (post.media && post.media.url) || 'https://source.unsplash.com/random/300x300';
    const type = post.mediaType || (post.media && post.media.type) || 'image';

    const handleDoubleTap = async (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        setHeart({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            id: Date.now()
        });

        setTimeout(() => setHeart(null), 800);

        if (!likesCount.liked) {
            // Optimistic update
            const prevCount = likesCount.count;
            setLikesCount({ count: prevCount + 1, liked: true });
            
            try {
                // If API exists: await fetch(`/api/post-likes?postId=${post.id}`, { method: 'POST' });
                // We'll simulate a fetch for the optimistic update
            } catch {
                // Rollback on failure
                setLikesCount({ count: prevCount, liked: false });
            }
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative w-full cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                style={{ position: 'relative', width: '100%', height: '220px' }}
                onDoubleClick={handleDoubleTap}
            >
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(28, 25, 23, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    zIndex: 10,
                    pointerEvents: 'none',
                }}>
                    <span style={{ color: likesCount.liked ? '#ff3b30' : '#fff', fontSize: '18px', fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        {likesCount.liked ? '❤️' : '♥'} {likesCount.count}
                    </span>
                </div>

                <AnimatePresence>
                    {heart && (
                        <motion.div
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            style={{
                                position: 'absolute',
                                left: heart.x - 20, // offset center
                                top: heart.y - 20, // offset center
                                color: '#ff3b30',
                                fontSize: '40px',
                                zIndex: 20,
                                pointerEvents: 'none',
                            }}
                        >
                            ❤️
                        </motion.div>
                    )}
                </AnimatePresence>

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
        </motion.div>
    )
}

