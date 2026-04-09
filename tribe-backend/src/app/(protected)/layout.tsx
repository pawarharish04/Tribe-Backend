import BottomNav from '../../components/navigation/BottomNav';

/**
 * (protected)/layout.tsx
 * Route group layout for all authenticated pages.
 * Uses the new dark glassmorphism BottomNav instead of the old top Navbar.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <main style={{ minHeight: '100vh', background: '#0a0a0f' }}>
                {children}
            </main>
            <BottomNav />
        </>
    );
}
