"use client"

import FeedSectionHeader from "./FeedSectionHeader"
import HorizontalScroller from "./HorizontalScroller"

export default function FeedSection({
    title,
    link,
    children
}: {
    title: string
    link: string
    children: React.ReactNode
}) {
    return (
        <section style={{ marginBottom: '40px' }}>
            <FeedSectionHeader title={title} link={link} />

            <HorizontalScroller>
                {children}
            </HorizontalScroller>
        </section>
    )
}
