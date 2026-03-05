export const TOKENS = {
    colors: {
        cream: "#F7F3ED",
        cream2: "#EFE9E0",
        parchment: "#E8E0D4",
        ink: "#1C1917",
        inkMid: "#44403C",
        inkLight: "#78716C",
        inkFaint: "#A8A29E",
        sage: "#5C7A5F",
        clay: "#B85C38",
        indigo: "#3D4F7C",
        gold: "#A07840",
        sep: "#D6CFC6",

        // Soft variants
        sageSoft: '#EDF2ED',
        claySoft: '#FBF0EC',
        indigoSoft: '#EDF0F7',
        goldSoft: '#F7F0E6',
    },

    typography: {
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
        },
    },

    radius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        xl: "32px",
        full: "50%",
    },

    spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        xxl: "72px"
    },

    breakpoints: {
        mobile: 640,
        tablet: 900,
        laptop: 1200,
        desktop: 1440
    },

    shadows: {
        sm: '0 2px 12px rgba(28,25,23,0.05)',
        md: '0 8px 28px rgba(28,25,23,0.10)',
        lg: '0 48px 96px rgba(28,25,23,0.18)',
        glowSage: '0 0 60px rgba(92,122,95,0.15)',
        glowClay: '0 0 60px rgba(184,92,56,0.15)',
    },

    zIndex: {
        base: 1,
        header: 100,
        modal: 1000,
        toast: 2000,
    }
} as const;
