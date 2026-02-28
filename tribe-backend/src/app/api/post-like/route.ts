import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { getUserIdFromRequest } from "../../../lib/auth"

export async function POST(req: Request) {
    const userId = getUserIdFromRequest(req)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId } = await req.json()
    if (!postId) {
        return NextResponse.json({ error: "postId required" }, { status: 400 })
    }

    try {
        const post = await prisma.interestPost.findUnique({
            where: { id: postId },
            select: { userId: true }
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        if (post.userId === userId) {
            return NextResponse.json({ error: "Cannot like your own post" }, { status: 400 })
        }

        await prisma.postLike.upsert({
            where: {
                postId_likerId: {
                    postId,
                    likerId: userId
                }
            },
            update: {},
            create: {
                postId,
                likerId: userId
            }
        })

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
