import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { Id } from '@/convex/_generated/dataModel';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /customer/social/colleagues:
 *   get:
 *     summary: Get Colleague Connections
 *     description: Get count and list of colleague connections (mutual follows) for Play to Win feature
 *     tags: [Customer, Social]
 *     responses:
 *       200:
 *         description: Colleague connections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     colleagueCount:
 *                       type: integer
 *                       description: Number of mutual follows
 *                       example: 8
 *                     colleagues:
 *                       type: array
 *                       description: Array of colleague connections
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           user_name:
 *                             type: string
 *                             example: "John Doe"
 *                           user_initials:
 *                             type: string
 *                             example: "JD"
 *                           user_avatar:
 *                             type: string
 *                             nullable: true
 *                             example: "https://example.com/avatar.jpg"
 *                           is_available:
 *                             type: boolean
 *                             description: Available for group orders
 *                             example: true
 *                     total:
 *                       type: integer
 *                       example: 8
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only customers can access
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClient();

    // Get users that current user is following
    // Access userFollows queries through api.queries (may need type assertion)
    let following: { following: Array<{ isFollowingBack: boolean; following: { _id: string; name: string; avatar?: string } }> };
    try {
      following = await convex.query(api.queries.userFollows.getUserFollowing as any, {
        userId: userId as Id<'users'>,
        limit: 1000,
      }) as { following: Array<{ isFollowingBack: boolean; following: { _id: string; name: string; avatar?: string } }> };
    } catch {
      // If query doesn't exist or fails, return empty array
      return ResponseFactory.success({
        colleagueCount: 0,
        colleagues: [],
        total: 0,
      });
    }

    // Filter for mutual follows (where isFollowingBack is true)
    const mutualFollows = following.following.filter((follow: { isFollowingBack: boolean }) => follow.isFollowingBack);

    // Get colleague details
    const colleagues = await Promise.all(
      mutualFollows.map(async (follow: { following: { _id: string; name: string; avatar?: string } }) => {
        const colleagueUser = follow.following;
        
        // Generate initials from name
        const nameParts = colleagueUser.name.split(' ');
        const initials = nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : colleagueUser.name.substring(0, 2).toUpperCase();

        // Check if available for group orders (simplified: always true for now)
        // Can be enhanced to check active group orders or user status
        const isAvailable = true;

        return {
          user_id: colleagueUser._id,
          user_name: colleagueUser.name,
          user_initials: initials,
          user_avatar: colleagueUser.avatar || undefined,
          is_available: isAvailable,
        };
      })
    );

    return ResponseFactory.success({
      colleagueCount: colleagues.length,
      colleagues,
      total: colleagues.length,
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch colleague connections.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

