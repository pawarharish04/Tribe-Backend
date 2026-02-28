import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest } from '../../../lib/auth';
import ProfileEditor from '../../../components/profile/ProfileEditor';

/**
 * /me  – Profile editor page
 *
 * This is a Server Component: it fetches all data on the server and passes
 * it to the <ProfileEditor /> Client Component as props.
 *
 * Auth: reads the JWT from the Authorization header via a fake Request built
 * from the cookie stored as `tribe_token`. Falls back to redirect to /login.
 */
export default async function MePage() {
    // Build a fake Request so we can reuse getUserIdFromRequest
    const cookieStore = await cookies();
    const token = cookieStore.get('tribe_token')?.value;

    let userId: string | null = null;
    if (token) {
        const fakeReq = new Request('http://localhost', {
            headers: { Authorization: `Bearer ${token}` },
        });
        userId = getUserIdFromRequest(fakeReq);
    }

    if (!userId) {
        // No valid server-side token — client pages handle the redirect via
        // localStorage, but if the server can't auth, send to login.
        redirect('/login');
    }

    // Fetch profile
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            avatarUrl: true,
            locationEnabled: true,
            interests: {
                select: {
                    id: true,
                    level: true,
                    interest: { select: { id: true, name: true } },
                },
                orderBy: { level: 'desc' },
            },
            interestPosts: {
                select: {
                    id: true,
                    caption: true,
                    createdAt: true,
                    interest: { select: { id: true, name: true } },
                    media: { select: { id: true, url: true, type: true } },
                    _count: { select: { likes: true } },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!user) redirect('/login');

    // Stats
    const [matchCount, postLikeCount, messageCount] = await Promise.all([
        prisma.matchUnlock.count({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        }),
        prisma.postLike.count({
            where: { post: { userId } },
        }),
        prisma.message.count({
            where: { senderId: userId },
        }),
    ]);

    // ProfileEditor is a client component — it needs the JWT to make PATCH
    // calls. Since the page is server-rendered and the token is in a cookie,
    // pass it down so the client does not re-read localStorage.
    const jwt = token ?? '';

    return (
        <ProfileEditor
            profile={{
                id: user.id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                locationEnabled: user.locationEnabled,
                interests: user.interests.map(i => ({ ...i, level: i.level ?? 1 })),
                interestPosts: user.interestPosts.map(p => ({
                    ...p,
                    createdAt: p.createdAt.toISOString(),
                })),
            }}
            stats={{
                matches: matchCount,
                postLikes: postLikeCount,
                messagesSent: messageCount,
            }}
            jwt={jwt}
        />
    );
}
