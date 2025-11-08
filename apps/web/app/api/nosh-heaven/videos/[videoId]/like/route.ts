import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getUserFromRequest } from '@/lib/auth/session';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/like:
 *   post:
 *     summary: Like a video
 *     description: Likes a video post
 *     tags: [Nosh Heaven, Videos, Interactions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
 *     responses:
 *       200:
 *         description: Video liked successfully
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
 *                   example: "Video liked successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
): Promise<NextResponse> {
  try {
    const { videoId } = params;

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    // Get user from session token
    const convex = getConvexClient();
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Like video
    await convex.mutation((api as any).mutations.videoPosts.likeVideo, {
      videoId,
    });

    return ResponseFactory.success(null, 'Video liked successfully');

  } catch (error: any) {
    logger.error('Video like error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to like video');
  }
}

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/like:
 *   delete:
 *     summary: Unlike a video
 *     description: Removes like from a video post
 *     tags: [Nosh Heaven, Videos, Interactions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
 *     responses:
 *       200:
 *         description: Video unliked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
): Promise<NextResponse> {
  try {
    const { videoId } = params;

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    // Get user from session token
    const convex = getConvexClient();
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Unlike video
    await convex.mutation((api as any).mutations.videoPosts.unlikeVideo, {
      videoId,
    });

    return ResponseFactory.success(null, 'Video unliked successfully');

  } catch (error: any) {
    logger.error('Video unlike error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to unlike video');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  return handlePOST(request, { params: { videoId } });
}));
export const DELETE = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  return handleDELETE(request, { params: { videoId } });
}));
