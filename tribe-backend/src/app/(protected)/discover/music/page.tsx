import { T } from '../../../../design/tokens';
import WorkCard from '../../../../components/feed/WorkCard';

export default async function MusicDiscoveryPage() {
    const music = await fetch(
        "http://localhost:3000/api/trending?interest=music",
        { cache: 'no-store' }
    ).then(r => r.ok ? r.json() : []).catch(() => []);

    return (
        <div style={{ minHeight: '100vh', background: T.cream, padding: '40px 20px 80px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', borderBottom: `1px solid ${T.sep}`, paddingBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.indigo, letterSpacing: '-0.03em', marginBottom: '6px' }}>Music</h1>
                <p style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, lineHeight: 1.6 }}>
                    Discover sounds, melodies, and the rhythm of the Tribe.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px',
                justifyItems: 'center'
            }}>
                {music.length > 0 ? music.map((p: any) => (
                    <WorkCard key={p.id} post={p} />
                )) : (
                    <p style={{ color: T.inkFaint, fontFamily: 'Georgia,serif', gridColumn: '1 / -1', textAlign: 'center', marginTop: '40px' }}>Loading soundscapes...</p>
                )}
            </div>
        </div>
    )
}
