'use client';

import React from 'react';

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    as?: React.ElementType;
}

export function Container({ children, className = '', style = {}, as: Component = 'div' }: ContainerProps) {
    return (
        <Component
            className={`tribe-container ${className}`}
            style={style}
        >
            {children}
            <style jsx>{`
                .tribe-container {
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 16px; /* Mobile base */
                }

                @media (min-width: 640px) {
                    .tribe-container {
                        padding: 0 28px; /* Tablet */
                    }
                }

                @media (min-width: 1200px) {
                    .tribe-container {
                        padding: 0 40px; /* Desktop */
                    }
                }
            `}</style>
        </Component>
    );
}
