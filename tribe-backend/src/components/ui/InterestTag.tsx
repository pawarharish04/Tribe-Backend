'use client';

interface InterestTagProps {
    name: string;
    isExactMatch?: boolean;
    isParentMatch?: boolean;
    size?: 'sm' | 'md';
    onClick?: () => void;
}

export default function InterestTag({ name, isExactMatch, isParentMatch, size = 'md', onClick }: InterestTagProps) {
    const sizes = {
        sm: { px: '4px 10px', fontSize: '11px' },
        md: { px: '6px 14px', fontSize: '12px' },
    }[size];

    const style: React.CSSProperties = isExactMatch
        ? {
            background: 'rgba(139,92,246,0.18)',
            border: '1px solid rgba(139,92,246,0.55)',
            color: '#a78bfa',
            boxShadow: '0 0 12px rgba(139,92,246,0.35), inset 0 0 8px rgba(139,92,246,0.10)',
        }
        : isParentMatch
        ? {
            background: 'rgba(20,184,166,0.12)',
            border: '1px solid rgba(20,184,166,0.35)',
            color: '#2dd4bf',
        }
        : {
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(248,250,252,0.55)',
        };

    return (
        <span
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: sizes.px,
                borderRadius: '999px',
                fontSize: sizes.fontSize,
                fontWeight: isExactMatch ? 600 : 500,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1,
                backdropFilter: 'blur(8px)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                ...style,
            }}
        >
            {isExactMatch && <span style={{ fontSize: '8px' }}>✦</span>}
            {name}
        </span>
    );
}
