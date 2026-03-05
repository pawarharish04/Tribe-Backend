"use client"

export default function HorizontalScroller({ children }: { children: React.ReactNode }) {
    return (
        <div className="horizontal-scroller" style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px',
            paddingLeft: '20px',
            paddingRight: '20px',
            msOverflowStyle: 'none',  /* IE and Edge */
            scrollbarWidth: 'none'    /* Firefox */
        }}>
            <style jsx>{`
        .horizontal-scroller::-webkit-scrollbar {
          display: none;
        }
      `}</style>
            {children}
        </div>
    )
}
