import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Navigation Layer */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 40px', maxWidth: '1200px', width: '100%', margin: '0 auto'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
          Tribe
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/login" style={{
            padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)',
            textDecoration: 'none', transition: 'var(--transition)'
          }}>
            Log In
          </Link>
          <Link href="/register" style={{
            padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#fff',
            background: 'var(--accent)', borderRadius: '100px', textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(124,106,247,0.3)', transition: 'var(--transition)'
          }}>
            Create Account
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Section 1 — Hero */}
        <section style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '120px 20px', maxWidth: '800px', margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em',
            marginBottom: '24px', color: '#fff'
          }}>
            Discover Your <span style={{ color: 'var(--accent)' }}>People.</span>
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 2vw, 22px)', color: 'var(--text-secondary)',
            marginBottom: '48px', maxWidth: '600px', lineHeight: 1.5
          }}>
            A network built on genuine compatibility. Connect through shared interests,
            deep expressions, and reciprocal interactions.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/register" style={{
              padding: '16px 40px', fontSize: '16px', fontWeight: 600, color: '#fff',
              background: 'var(--accent)', borderRadius: '100px', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(124,106,247,0.4)', transition: 'var(--transition)'
            }}>
              Start Discovering
            </Link>
            <Link href="/login" style={{
              padding: '16px 40px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '100px', textDecoration: 'none',
              transition: 'var(--transition)'
            }}>
              Log In
            </Link>
          </div>
        </section>

        {/* Section 2 — How It Works */}
        <section style={{ padding: '80px 20px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '48px', color: '#fff' }}>
              How It Works
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>

              {/* Block 1 */}
              <div style={{ background: 'var(--bg-card)', padding: '40px 32px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Choose your interests</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                  Select the topics you care about. We build your compatibility profile from the ground up.
                </p>
              </div>

              {/* Block 2 */}
              <div style={{ background: 'var(--bg-card)', padding: '40px 32px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📸</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Express visually</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                  Share moments tied directly to your interests to authenticate your passion.
                </p>
              </div>

              {/* Block 3 */}
              <div style={{ background: 'var(--bg-card)', padding: '40px 32px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>✨</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Discover nearby</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                  Explore a curated feed of people around you mathematically ranked by compatibility.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 3 — Compatibility Explained */}
        <section style={{ padding: '120px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
            The Science of Connection
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '48px' }}>
            Our engine evaluates multiple dimensions locally to build your perfect network.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '16px',
            background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '100px', border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Compatibility</span>
            <span style={{ color: 'var(--text-muted)' }}>=</span>
            <span style={{ color: 'var(--green)' }}>Interests</span>
            <span style={{ color: 'var(--text-muted)' }}>+</span>
            <span style={{ color: 'var(--accent)' }}>Depth</span>
            <span style={{ color: 'var(--text-muted)' }}>+</span>
            <span style={{ color: 'var(--gold)' }}>Activity</span>
            <span style={{ color: 'var(--text-muted)' }}>+</span>
            <span style={{ color: '#22d3ee' }}>Proximity</span>
          </div>
        </section>

        {/* Section 4 — Call To Action */}
        <section style={{
          padding: '80px 20px 120px', textAlign: 'center',
          background: 'linear-gradient(to top, rgba(124,106,247,0.05), transparent)'
        }}>
          <h2 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '32px', color: '#fff', letterSpacing: '-0.02em' }}>
            Ready to find your Tribe?
          </h2>
          <Link href="/register" style={{
            display: 'inline-block', padding: '18px 48px', fontSize: '18px', fontWeight: 600, color: '#fff',
            background: 'var(--accent)', borderRadius: '100px', textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(124,106,247,0.4)', transition: 'var(--transition)'
          }}>
            Start Discovering
          </Link>
        </section>

      </main>
    </div>
  );
}
