"use client"

import { useInView } from "react-intersection-observer"
import { useEffect } from "react"

export default function InfiniteFeed({ loadMore }: { loadMore: () => void }) {
    const { ref, inView } = useInView()

    useEffect(() => {
        if (inView) {
            loadMore()
        }
    }, [inView, loadMore])

    return <div ref={ref} style={{ height: '40px', width: '100%' }} />
}
