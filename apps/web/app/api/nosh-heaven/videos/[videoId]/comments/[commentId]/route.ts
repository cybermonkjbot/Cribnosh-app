import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/comments/{commentId}:
 *   get:
 *     summary: Get comment by ID
 *     description: Retrieves a specific comment by its ID
 *     tags: [Nosh Heaven, Videos, Comments]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VideoComment'
 *                 message:
 *                   type: string
 *                   example: "Comment retrieved successfully"
 *       404:
 *         description: Comment not found
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { videoId: string; commentId: string } }
): Promise<NextResponse> {
  try {
    const { videoId, commentId } = params;

    if (!videoId || !commentId) {
      return ResponseFactory.validationError('Video ID and Comment ID are required');
    }

    const convex = getConvexClient();
    const comment = await convex.query((api as any).queries.videoComments.getCommentById, {
      commentId,
    });

    if (!comment) {
      return ResponseFactory.notFound('Comment not found');
    }

    return ResponseFactory.success(comment, 'Comment retrieved successfully');

  } catch (error: any) {
    console.error('Comment retrieval error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to retrieve comment');
  }
}

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/comments/{commentId}:
 *   put:
 *     summary: Update comment
 *     description: Updates an existing comment
 *     tags: [Nosh Heaven, Videos, Comments]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated comment content
 *                 example: "Updated comment text"
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 */
async function handlePUT(
  request: NextRequest,
  { params }: { params: { videoId: string; commentId: string } }
): Promise<NextResponse> {
  try {
    const { videoId, commentId } = params;
    const body = await request.json();

    if (!videoId || !commentId) {
      return ResponseFactory.validationError('Video ID and Comment ID are required');
    }

    if (!body.content || body.content.trim().length === 0) {
      return ResponseFactory.validationError('Comment content is required');
    }

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const user = await convex.query(api.queries.users.getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Update comment
    await convex.mutation((api as any).mutations.videoComments.updateComment, {
      commentId,
      content: body.content.trim(),
    });

    return ResponseFactory.success(null, 'Comment updated successfully');

  } catch (error: any) {
    console.error('Comment update error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to update comment');
  }
}

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     description: Deletes an existing comment
 *     tags: [Nosh Heaven, Videos, Comments]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { videoId: string; commentId: string } }
): Promise<NextResponse> {
  try {
    const { videoId, commentId } = params;

    if (!videoId || !commentId) {
      return ResponseFactory.validationError('Video ID and Comment ID are required');
    }

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const user = await convex.query(api.queries.users.getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Delete comment
    await convex.mutation((api as any).mutations.videoComments.deleteComment, {
      commentId,
    });

    return ResponseFactory.success(null, 'Comment deleted successfully');

  } catch (error: any) {
    console.error('Comment deletion error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to delete comment');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  const commentId = url.pathname.split("/")[6];
  return handleGET(request, { params: { videoId, commentId } });
}));
export const PUT = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  const commentId = url.pathname.split("/")[6];
  return handlePUT(request, { params: { videoId, commentId } });
}));
export const DELETE = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  const commentId = url.pathname.split("/")[6];
  return handleDELETE(request, { params: { videoId, commentId } });
}));
