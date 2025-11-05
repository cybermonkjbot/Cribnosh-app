import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getApiFunction, getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/edit:
 *   put:
 *     summary: Edit video
 *     description: Edit video details (title, description, tags, cuisine, difficulty, visibility)
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

    // Update video post
    const updateVideoPost = getApiFunction('mutations/videoPosts', 'updateVideoPost');
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
    console.error('Error in video edit:', error);
    const message = error instanceof Error ? error.message : 'Failed to edit video';
    
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
