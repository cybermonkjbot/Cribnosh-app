// @ts-nocheck
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { showError } from '@/lib/GlobalToastManager';
import { useCallback, useEffect, useState } from 'react';

interface UseFollowCreatorOptions {
    creatorUserId: string | undefined;
}

interface UseFollowCreatorResult {
    isFollowing: boolean;
    followerCount: number;
    loading: boolean;
    toggle: () => Promise<void>;
}

/**
 * Hook to follow/unfollow a food creator with optimistic UI.
 * creatorUserId is the `users` table ID of the creator (not the food creator ID).
 */
export function useFollowCreator({ creatorUserId }: UseFollowCreatorOptions): UseFollowCreatorResult {
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Fetch initial follow state and follower count
    useEffect(() => {
        if (!creatorUserId) return;

        let cancelled = false;

        const load = async () => {
            try {
                const convex = getConvexClient();
                const sessionToken = await getSessionToken();
                if (!sessionToken || cancelled) return;

                // Check isFollowing
                const followingResult = await convex.query(api.queries.userFollows.isFollowing, {
                    followingId: creatorUserId as any,
                });

                // Get follower count
                const statsResult = await convex.query(api.queries.userFollows.getUserFollowStats, {
                    userId: creatorUserId as any,
                });

                if (!cancelled) {
                    setIsFollowing(followingResult ?? false);
                    setFollowerCount(statsResult?.followersCount ?? 0);
                    setInitialized(true);
                }
            } catch (err) {
                // Silently fail — not critical
                if (!cancelled) setInitialized(true);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [creatorUserId]);

    const toggle = useCallback(async () => {
        if (!creatorUserId || loading) return;

        // Optimistic update
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        setFollowerCount((c) => wasFollowing ? Math.max(0, c - 1) : c + 1);
        setLoading(true);

        try {
            const convex = getConvexClient();
            const sessionToken = await getSessionToken();
            if (!sessionToken) throw new Error('Not authenticated');

            if (wasFollowing) {
                await convex.mutation(api.mutations.userFollows.unfollowUser, {
                    followingId: creatorUserId as any,
                });
            } else {
                await convex.mutation(api.mutations.userFollows.followUser, {
                    followingId: creatorUserId as any,
                });
            }
        } catch (err: any) {
            // Revert on error
            setIsFollowing(wasFollowing);
            setFollowerCount((c) => wasFollowing ? c + 1 : Math.max(0, c - 1));
            showError('Could not update follow', err?.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    }, [creatorUserId, isFollowing, loading]);

    return { isFollowing, followerCount, loading, toggle };
}
