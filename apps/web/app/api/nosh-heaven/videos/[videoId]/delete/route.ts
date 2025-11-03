import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getApiFunction, getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/delete:
 *   delete:
 *     summary: Delete video
 *     description: Soft delete a video post (sets status to 'removed')
 *     tags: [Nosh Heaven, Videos]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to delete this video
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
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

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const getUserByToken = getApiFunction('queries/users', 'getUserByToken');
    const user = await convex.query(getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Delete video post (soft delete - sets status to 'removed')
    const deleteVideoPost = getApiFunction('mutations/videoPosts', 'deleteVideoPost');
    await convex.mutation(deleteVideoPost, {
      videoId: videoId as any,
    });

    return ResponseFactory.success(null, 'Video deleted successfully');

  } catch (error: unknown) {
    console.error('Error in video delete:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete video';
    
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

export const DELETE = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[4];
  return handleDELETE(request, { params: { videoId } });
}));
