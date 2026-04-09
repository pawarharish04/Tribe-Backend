'use client';

interface SkeletonCardProps {
    variant?: 'feed' | 'profile' | 'chat' | 'post';
}

function Bone({ w, h, r = '8px', style }: { w: string; h: string; r?: string; style?: React.CSSProperties }) {
    return (
        <div style={{
            width: w, height: h, borderRadius: r,
            background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s infinite',
            flexShrink: 0,
            ...style,
        }} />
    );
}

export default function SkeletonCard({ variant = 'feed' }: SkeletonCardProps) {
    if (variant === 'feed') return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            width: '100%', maxWidth: '400px',
        }}>
            {/* Header image bone */}
            <Bone w="100%" h="260px" r="0" />
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Bone w="120px" h="20px" />
                    <Bone w="64px" h="24px" r="999px" />
                </div>
                <Bone w="80px" h="14px" />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Bone w="60px" h="22px" r="999px" />
                    <Bone w="70px" h="22px" r="999px" />
                    <Bone w="50px" h="22px" r="999px" />
                </div>
            </div>
        </div>
    );

    if (variant === 'profile') return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Bone w="80px" h="80px" r="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Bone w="150px" h="22px" />
                    <Bone w="100px" h="14px" />
                </div>
            </div>
            <Bone w="100%" h="60px" />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[80, 70, 90, 60].map((w, i) => <Bone key={i} w={`${w}px`} h="26px" r="999px" />)}
            </div>
        </div>
    );

    if (variant === 'chat') return (
        <div style={{ display: 'flex', gap: '12px', padding: '16px', alignItems: 'flex-start' }}>
            <Bone w="44px" h="44px" r="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Bone w="100px" h="14px" />
                    <Bone w="40px" h="12px" />
                </div>
                <Bone w="200px" h="13px" />
            </div>
        </div>
    );

    // post
    return (
        <div style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
            <Bone w="100%" h="100%" r="0" />
        </div>
    );
}
