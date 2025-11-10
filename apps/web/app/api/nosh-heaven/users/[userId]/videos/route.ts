import { NextRequest, NextResponse } from 'next/server';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/nosh-heaven/users/{userId}/videos:
 *   get:
 *     summary: Get user's videos
 *     description: Retrieves videos created by a specific user
 *     tags: [Nosh Heaven, Users, Videos]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of videos to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: User videos retrieved successfully
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
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoPost'
 *                     nextCursor:
 *                       type: string
 *                       description: Cursor for next page
 *                 message:
 *                   type: string
 *                   example: "User videos retrieved successfully"
 *       404:
 *         description: User not found
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const cursor = searchParams.get('cursor') || undefined;

    if (!userId) {
      return ResponseFactory.validationError('User ID is required');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const videos = await convex.query((api as any).queries.videoPosts.getVideosByCreator, {
      creatorId: userId,
      limit,
      cursor,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(videos, 'User videos retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('User videos retrieval error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to retrieve user videos'));
  }
}

// Wrapper function to extract params from URL
export const GET = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const userId = url.pathname.split('/')[4]; // Extract userId from /api/nosh-heaven/users/[userId]/videos
  return handleGET(request, { params: { userId } });
}));
