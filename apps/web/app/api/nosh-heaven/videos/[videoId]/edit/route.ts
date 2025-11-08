import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { getApiFunction, getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/edit:
 *   put:
 *     summary: Edit video
 *     description: Edit video details (title, description, tags, cuisine, difficulty, visibility)
 *     tags: [Nosh Heaven, Videos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               cuisine:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               visibility:
 *                 type: string
 *                 enum: [public, followers, private]
 *     responses:
 *       200:
 *         description: Video edited successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to edit this video
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
async function handlePUT(
  request: NextRequest,
  { params }: { params: { videoId: string } }
): Promise<NextResponse> {
  try {
    const { videoId } = params;
    const body = await request.json();

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    // Get user from session token
    const convex = getConvexClientFromRequest(request);
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Update video post
    const updateVideoPost = getApiFunction('mutations/videoPosts', 'updateVideoPost') as any;
    await convex.mutation(updateVideoPost, {
      videoId: videoId as any,
      title: body.title,
      description: body.description,
      tags: body.tags,
      cuisine: body.cuisine,
      difficulty: body.difficulty,
      visibility: body.visibility,
    });

    return ResponseFactory.success(null, 'Video edited successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error in video edit:', error);
    const message = getErrorMessage(error, 'Failed to edit video');
    
    // Handle specific error cases
    if (message.includes('not authorized')) {
      return ResponseFactory.forbidden(message);
    }
    if (message.includes('not found')) {
      return ResponseFactory.notFound(message);
    }
    
    return ResponseFactory.internalError(message);
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[4];
  return handlePUT(request, { params: { videoId } });
}));
