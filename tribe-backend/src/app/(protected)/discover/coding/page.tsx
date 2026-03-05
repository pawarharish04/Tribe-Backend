import { T } from '../../../../design/tokens';
import WorkCard from '../../../../components/feed/WorkCard';

export default async function CodingDiscoveryPage() {
    const coding = await fetch(
        "http://localhost:3000/api/trending?interest=coding",
        { cache: 'no-store' }
    ).then(r => r.ok ? r.json() : []).catch(() => []);

    return (
        <div style={{ minHeight: '100vh', background: T.cream, padding: '40px 20px 80px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', borderBottom: `1px solid ${T.sep}`, paddingBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontStyle: 'italic', color: T.clay, letterSpacing: '-0.03em', marginBottom: '6px' }}>Coding</h1>
                <p style={{ fontSize: '14px', fontFamily: "'Cormorant Garamond',Georgia,serif", color: T.inkLight, lineHeight: 1.6 }}>
                    Discover projects, architectures, and the digital craft.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px',
                justifyItems: 'center'
            }}>
                {coding.length > 0 ? coding.map((p: any) => (
                    <WorkCard key={p.id} post={p} />
                )) : (
                    <p style={{ color: T.inkFaint, fontFamily: 'Georgia,serif', gridColumn: '1 / -1', textAlign: 'center', marginTop: '40px' }}>Loading projects...</p>
                )}
            </div>
        </div>
    )
}
