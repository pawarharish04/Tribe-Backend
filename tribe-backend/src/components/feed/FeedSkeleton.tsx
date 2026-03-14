import { T } from '../../design/tokens';

export default function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '16px', overflow: 'hidden', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ 
          minWidth: '220px', 
          height: '220px', 
          borderRadius: '16px', 
          background: T.parchment,
          animation: 'pulse 1.5s ease infinite',
          border: `1px solid ${T.sep}`
        }} />
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
