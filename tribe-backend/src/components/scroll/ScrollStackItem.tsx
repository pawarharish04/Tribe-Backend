'use client';

import { useRef, useEffect, useContext } from 'react';
import { ScrollStackCtx } from './ScrollStack';

// ── Config ────────────────────────────────────────────────────────────────────
const STACK_TOP = 72;   // px  — navbar height offset so card peeks below navbar
const STACK_STEP = 12;   // px  — additional top offset per card for the "layered" feel
const SCALE_PER_CARD = 0.032;// how much each buried card shrinks per level above it
const MIN_SCALE = 0.84; // never shrink below this
const BLUR_PER_CARD = 1;    // px blur per level above
const MAX_BLUR = 6;    // px  — cap
const ITEM_DISTANCE = 120;  // px  — scroll needed to fully transition to next card

// ── ScrollStackItem ───────────────────────────────────────────────────────────
// Drop this around any card content.
// • Sticky at top: STACK_TOP + index * STACK_STEP
// • On scroll: earlier cards scale + blur gently via JS (no React re-render)

interface ScrollStackItemProps {
    index: number;
    totalItems: number;
    accentColor?: string;
    children: React.ReactNode;
}

export default function ScrollStackItem({
    index,
    totalItems,
    accentColor = 'transparent',
    children,
}: ScrollStackItemProps) {
    const itemRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const { containerRef } = useContext(ScrollStackCtx);

    // ── Detect mobile (disable blur on small screens) ──────────────────────────
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // ── Scroll listener → update transform via DOM (no React state) ────────────
    useEffect(() => {
        const item = itemRef.current;
        const inner = innerRef.current;
        if (!item || !inner) return;

        const update = () => {
            // How many cards above us have scrolled past their own sticky top?
            // We scan siblings that have a data-ss-index < our index.
            const myTop = STACK_TOP + index * STACK_STEP;
            const scrollY = window.scrollY;
            const itemOffsetY = item.getBoundingClientRect().top + scrollY;   // distance from doc top

            // Cards that are already stacked above ours push our scale down.
            // We approximate by looking at how far the viewport has scrolled
            // past a virtual "hand-off point" for each level.
            // Each level's hand-off = itemOffsetY + level * ITEM_DISTANCE
            // (we don't need exact sibling positions; stagger is consistent enough)

            // The last card never needs to shrink.
            if (index === totalItems - 1) return;

            // Progress of the NEXT card sliding over this one (0 → 1)
            const nextHandOff = itemOffsetY + ITEM_DISTANCE;
            const progress = Math.max(0, Math.min(1, (scrollY - nextHandOff + ITEM_DISTANCE) / ITEM_DISTANCE));

            const scale = Math.max(MIN_SCALE, 1 - progress * SCALE_PER_CARD);
            const blurPx = isMobile ? 0 : Math.min(MAX_BLUR, progress * BLUR_PER_CARD);

            inner.style.transform = `scale(${scale.toFixed(4)})`;
            inner.style.filter = blurPx > 0.1 ? `blur(${blurPx.toFixed(2)}px)` : '';
        };

        window.addEventListener('scroll', update, { passive: true });
        update(); // initial call

        return () => window.removeEventListener('scroll', update);
    }, [index, totalItems, isMobile]);

    const stickyTop = STACK_TOP + index * STACK_STEP;
    const isLastCard = index === totalItems - 1;
    // Last card needs enough room beneath it so the stack doesn't jump.
    const minHeight = isLastCard ? '100vh' : `calc(100vh - ${stickyTop}px)`;

    return (
        <div
            ref={itemRef}
            data-ss-index={index}
            style={{
                position: 'sticky',
                top: `${stickyTop}px`,
                zIndex: 10 + index,
                // The margin below creates the scroll distance that triggers the next card.
                marginBottom: isLastCard ? 0 : `${ITEM_DISTANCE}px`,
                // Allow the card below to be visible
                willChange: 'transform',
            }}
        >
            {/* Inner wrapper: transform target (scale + blur happen here) */}
            <div
                ref={innerRef}
                style={{
                    transformOrigin: 'top center',
                    transition: 'transform 0.12s linear, filter 0.12s linear',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(28,25,23,0.08), 0 2px 8px rgba(28,25,23,0.04)',
                    border: '1px solid rgba(214,207,198,0.7)',
                    background: '#F7F3ED',
                    // Subtle left border accent matching the interest colour
                    outline: `2px solid ${accentColor}18`,
                    outlineOffset: '-2px',
                }}
            >
                {children}
            </div>
        </div>
    );
}
