'use client';

interface CompatibilityBadgeProps {
    score: number;     // 0–100
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function CompatibilityBadge({ score, size = 'md', showLabel = true }: CompatibilityBadgeProps) {
    const clamped = Math.min(100, Math.max(0, Math.round(score)));

    // Color shifts based on score
    const color = clamped >= 75 ? '#14b8a6'
                : clamped >= 50 ? '#8b5cf6'
                : '#ec4899';

    const sizes = {
        sm: { px: '4px 8px', fontSize: '10px', gap: '3px' },
        md: { px: '6px 12px', fontSize: '12px', gap: '4px' },
        lg: { px: '8px 16px', fontSize: '14px', gap: '6px' },
    }[size];

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: sizes.gap,
            padding: sizes.px,
            borderRadius: '999px',
            background: `${color}20`,
            border: `1px solid ${color}50`,
            backdropFilter: 'blur(8px)',
            boxShadow: `0 0 12px ${color}30`,
            fontFamily: 'Inter, sans-serif',
        }}>
            {/* Small dot indicator */}
            <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: color,
                boxShadow: `0 0 6px ${color}`,
                flexShrink: 0,
            }} />
            <span style={{
                fontSize: sizes.fontSize,
                fontWeight: 700,
                color,
                lineHeight: 1,
            }}>
                {clamped}%
            </span>
            {showLabel && (
                <span style={{
                    fontSize: '10px', fontWeight: 500,
                    color: `${color}bb`, lineHeight: 1,
                }}>
                    match
                </span>
            )}
        </div>
    );
}
