"use client"

import FeedSectionHeader from "./FeedSectionHeader"

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-5">
                {children}
            </div>
        </section>
    )
}
