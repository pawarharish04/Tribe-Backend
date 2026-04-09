'use client';

interface StatCardProps {
    label: string;
    value: number | string;
    icon?: string;
    accent?: 'purple' | 'pink' | 'teal' | 'gold';
}

const ACCENTS = {
    purple: { color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', bg: 'rgba(139,92,246,0.10)' },
    pink:   { color: '#ec4899', glow: 'rgba(236,72,153,0.3)',  bg: 'rgba(236,72,153,0.10)' },
    teal:   { color: '#14b8a6', glow: 'rgba(20,184,166,0.3)',  bg: 'rgba(20,184,166,0.10)' },
    gold:   { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.10)' },
};

export default function StatCard({ label, value, icon, accent = 'purple' }: StatCardProps) {
    const { color, glow, bg } = ACCENTS[accent];

    return (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid rgba(255,255,255,0.10)`,
            borderRadius: '16px',
            padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.3s',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 32px ${glow}`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
            {/* Glow orb */}
            <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '80px', height: '80px', borderRadius: '50%',
                background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {icon && (
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', marginBottom: '4px',
                }}>
                    {icon}
                </div>
            )}

            <div style={{
                fontSize: '36px', fontWeight: 800,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1, letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                {value}
            </div>

            <div style={{
                fontSize: '12px', fontWeight: 500,
                color: 'rgba(248,250,252,0.45)',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            }}>
                {label}
            </div>
        </div>
    );
}
