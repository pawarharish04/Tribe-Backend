import Navbar from '../../components/Navbar';

/**
 * (protected)/layout.tsx
 *
 * Route group layout for authenticated pages.
 * The parentheses in the folder name are a Next.js App Router convention —
 * they group routes WITHOUT affecting the URL. So /feed, /matches, /activity
 * keep their existing paths once moved under this folder.
 *
 * Phase 1: This file exists and compiles, but no routes have been moved yet.
 * Phase 2: Move feed, matches, activity, profile pages under (protected)/.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
}
