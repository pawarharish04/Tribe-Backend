/**
 * Tribe Design Tokens — Dark Glassmorphism System
 * Used by React components as typed constants.
 */
export const T = {
    // Backgrounds
    bg:            '#0a0a0f',
    bg1:           '#0f0f18',
    bg2:           '#13131e',
    bg3:           '#18182a',

    // Glass surfaces
    glass:         'rgba(255,255,255,0.06)',
    glassMd:       'rgba(255,255,255,0.09)',
    glassHigh:     'rgba(255,255,255,0.13)',

    // Borders
    sep:           'rgba(255,255,255,0.10)',
    borderMd:      'rgba(255,255,255,0.16)',

    // Accents
    purple:        '#8b5cf6',
    purpleLight:   '#a78bfa',
    pink:          '#ec4899',
    pinkLight:     '#f472b6',
    teal:          '#14b8a6',
    tealLight:     '#2dd4bf',

    // Gradients (as strings for inline styles)
    gradCta:       'linear-gradient(135deg,#8b5cf6,#ec4899)',
    gradTeal:      'linear-gradient(135deg,#14b8a6,#8b5cf6)',
    gradCard:      'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(236,72,153,0.06))',

    // Typography
    ink:           '#f8fafc',
    inkMid:        'rgba(248,250,252,0.65)',
    inkLight:      'rgba(248,250,252,0.45)',
    inkFaint:      'rgba(248,250,252,0.25)',

    // Semantic
    success:       '#10b981',
    successSoft:   'rgba(16,185,129,0.15)',
    error:         '#ef4444',
    errorSoft:     'rgba(239,68,68,0.15)',
    gold:          '#f59e0b',
    goldSoft:      'rgba(245,158,11,0.15)',

    // Legacy aliases (kept for existing components that reference old tokens)
    cream:         '#0a0a0f',
    cream2:        '#0f0f18',
    parchment:     '#13131e',
    sage:          '#8b5cf6',
    sageSoft:      'rgba(139,92,246,0.15)',
    clay:          '#ef4444',
    claySoft:      'rgba(239,68,68,0.15)',
    indigo:        '#6d28d9',
    indigoSoft:    'rgba(109,40,217,0.15)',
    goldSoftAlias: 'rgba(245,158,11,0.15)',

    // Shadows
    shadowSm:  '0 2px 8px rgba(0,0,0,0.3)',
    shadowMd:  '0 8px 24px rgba(0,0,0,0.4)',
    shadowLg:  '0 16px 48px rgba(0,0,0,0.5)',
    glowPurple:'0 0 24px rgba(139,92,246,0.4)',
    glowPink:  '0 0 24px rgba(236,72,153,0.4)',

    // Radii
    radius:    '16px',
    radiusSm:  '8px',
    radiusPill:'999px',
} as const;

export type TribeTokens = typeof T;

// Glass card css props helper
export const glassCard: React.CSSProperties = {
    background:       T.glass,
    backdropFilter:   'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border:           `1px solid ${T.sep}`,
    borderRadius:     T.radius,
    boxShadow:        T.shadowMd,
};
