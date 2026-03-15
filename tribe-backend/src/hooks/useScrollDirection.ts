import { useEffect, useState } from 'react';

export default function useScrollDirection() {
    const [direction, setDirection] = useState('up');

    useEffect(() => {
        let lastY = window.scrollY;

        const onScroll = () => {
            if (window.scrollY > lastY && window.scrollY > 50) {
                setDirection('down');
            } else {
                setDirection('up');
            }
            lastY = window.scrollY;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return direction;
}
