'use client';
import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
    elevated?: boolean;
    gradient?: boolean;
}

export default function GlassCard({
    children, style, className, onClick, hoverable = false, elevated = false, gradient = false
}: GlassCardProps) {
    const [hovered, setHovered] = React.useState(false);

    const base: React.CSSProperties = {
        background: elevated
            ? (hovered ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.09)')
            : (gradient ? 'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(236,72,153,0.06))'
                        : (hovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.06)')),
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: '16px',
        boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.4)',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        cursor: (hoverable || onClick) ? 'pointer' : 'default',
        ...style,
    };

    return (
        <div
            style={base}
            className={className}
            onClick={onClick}
            onMouseEnter={() => (hoverable || onClick) && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </div>
    );
}
