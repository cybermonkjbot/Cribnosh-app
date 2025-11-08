import { NextRequest, NextResponse } from 'next/server';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getUserFromRequest } from '@/lib/auth/session';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/nosh-heaven/users/{userId}/follow:
 *   post:
 *     summary: Follow a user
 *     description: Follows a user to see their content in the feed
 *     tags: [Nosh Heaven, Users, Social]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to follow
 *     responses:
 *       200:
 *         description: User followed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User followed successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = params;

    if (!userId) {
      return ResponseFactory.validationError('User ID is required');
    }

    // Get user from session token
    const convex = getConvexClientFromRequest(request);
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Follow user
    await convex.mutation((api as any).mutations.userFollows.followUser, {
      followingId: userId,
    });

    return ResponseFactory.success(null, 'User followed successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('User follow error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to follow user'));
  }
}

/**
 * @swagger
 * /api/nosh-heaven/users/{userId}/follow:
 *   delete:
 *     summary: Unfollow a user
 *     description: Unfollows a user
 *     tags: [Nosh Heaven, Users, Social]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = params;

    if (!userId) {
      return ResponseFactory.validationError('User ID is required');
    }

    // Get user from session token
    const convex = getConvexClientFromRequest(request);
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Unfollow user
    await convex.mutation((api as any).mutations.userFollows.unfollowUser, {
      followingId: userId,
    });

    return ResponseFactory.success(null, 'User unfollowed successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('User unfollow error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to unfollow user'));
  }
}

// Wrapper functions to extract params from URL
export const POST = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const userId = url.pathname.split('/')[4]; // Extract userId from /api/nosh-heaven/users/[userId]/follow
  return handlePOST(request, { params: { userId } });
}));

export const DELETE = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const userId = url.pathname.split('/')[4]; // Extract userId from /api/nosh-heaven/users/[userId]/follow
  return handleDELETE(request, { params: { userId } });
}));
