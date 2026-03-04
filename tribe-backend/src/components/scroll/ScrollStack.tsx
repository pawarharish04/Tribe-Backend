'use client';

import { useRef, useEffect, useCallback, createContext, useContext } from 'react';

// ── Context ───────────────────────────────────────────────────────────────────
// Shares the container ref so items can measure relative scroll position.
export const ScrollStackCtx = createContext<{ containerRef: React.RefObject<HTMLDivElement | null> }>({
    containerRef: { current: null },
});

// ── ScrollStack ───────────────────────────────────────────────────────────────
// A vertical storytelling container.  Each direct child (ScrollStackItem)
// pinned with position:sticky and scales down as the next card scrolls over it.
//
// Usage:
//   <ScrollStack>
//     <ScrollStackItem index={0} totalItems={3}> … </ScrollStackItem>
//     <ScrollStackItem index={1} totalItems={3}> … </ScrollStackItem>
//     <ScrollStackItem index={2} totalItems={3}> … </ScrollStackItem>
//   </ScrollStack>

interface ScrollStackProps {
    children: React.ReactNode;
    className?: string;
}

export default function ScrollStack({ children, className }: ScrollStackProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    return (
        <ScrollStackCtx.Provider value={{ containerRef }}>
            <div
                ref={containerRef}
                className={className}
                style={{ position: 'relative' }}
            >
                {children}
            </div>
        </ScrollStackCtx.Provider>
    );
}
