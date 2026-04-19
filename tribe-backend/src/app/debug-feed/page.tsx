// Server component — no "use client" directive.
// The production guard runs on the server before any HTML is sent to the client.
import { redirect } from 'next/navigation';
import DebugFeedClient from './DebugFeedClient';

export default function DebugFeedPage() {
    // ── Production guard — redirect to /feed; this page must never be
    //    reachable in production because it exposes internal scoring data.
    if (process.env.NODE_ENV === 'production') {
        redirect('/feed');
    }

    return <DebugFeedClient />;
}
