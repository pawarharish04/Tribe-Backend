// ── Warm Sand & Ink design tokens ────────────────────────────────────────────
// Reference with T.cream, T.ink, etc. in any inline-style component.

export const T = {
    // Backgrounds
    cream: '#F7F3ED',
    cream2: '#EFE9E0',
    parchment: '#E8E0D4',

    // Type
    ink: '#1C1917',
    inkMid: '#44403C',
    inkLight: '#78716C',
    inkFaint: '#A8A29E',

    // Structure
    sep: '#D6CFC6',

    // Earthy pigment accents
    sage: '#5C7A5F',
    clay: '#B85C38',
    indigo: '#3D4F7C',
    gold: '#A07840',

    // Soft tint variants
    sageSoft: '#EDF2ED',
    claySoft: '#FBF0EC',
    indigoSoft: '#EDF0F7',
    goldSoft: '#F7F0E6',
} as const;

// Interest palettes — first 4 map to the canonical earthy pigments
export const INTEREST_PALETTES = [
    { accent: T.sage, soft: T.sageSoft, cardTints: ['#EEF3EE', '#E6EDE7', '#DCE7DD'] as const, icon: '◉', number: '01' },
    { accent: T.clay, soft: T.claySoft, cardTints: ['#FBF2EE', '#F5E8E0', '#EEDDD4'] as const, icon: '◧', number: '02' },
    { accent: T.indigo, soft: T.indigoSoft, cardTints: ['#EEF0F7', '#E5E9F3', '#DADEEE'] as const, icon: '◌', number: '03' },
    { accent: T.gold, soft: T.goldSoft, cardTints: ['#F7F1E8', '#F0E8DA', '#E8DDCB'] as const, icon: '◈', number: '04' },
    { accent: '#6B5B95', soft: '#F3F0F8', cardTints: ['#F3F0F8', '#EAE6F3', '#DDDAEE'] as const, icon: '⬡', number: '05' },
    { accent: '#6B8E6B', soft: '#EFF4EF', cardTints: ['#EFF4EF', '#E6EFE6', '#DAEADA'] as const, icon: '◇', number: '06' },
] as const;

export type Palette = (typeof INTEREST_PALETTES)[number];

// Typography shorthand styles (use as spread into React style objects)
export const typo = {
    display: {
        fontFamily: "'Fraunces', Georgia, serif",
        fontWeight: 900 as const,
        fontStyle: 'italic' as const,
        letterSpacing: '-0.03em',
    },
    heading: {
        fontFamily: "'Fraunces', Georgia, serif",
        fontWeight: 700 as const,
        letterSpacing: '-0.025em',
    },
    body: {
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 400 as const,
        lineHeight: 1.7,
    },
    label: {
        fontFamily: "Georgia, serif",
        fontSize: '10px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: T.inkFaint,
    },
    mono: {
        fontFamily: "'Space Mono', monospace",
        fontSize: '10px',
    },
};
