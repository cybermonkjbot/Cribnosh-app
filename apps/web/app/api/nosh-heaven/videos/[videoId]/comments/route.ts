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
 * /api/nosh-heaven/videos/{videoId}/comments:
 *   get:
 *     summary: Get video comments
 *     description: Retrieves comments for a specific video
 *     tags: [Nosh Heaven, Videos, Comments]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of comments to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoComment'
 *                     nextCursor:
 *                       type: string
 *                       description: Cursor for next page
 *                 message:
 *                   type: string
 *                   example: "Comments retrieved successfully"
 *       404:
 *         description: Video not found
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
): Promise<NextResponse> {
  try {
    const { videoId } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const cursor = searchParams.get('cursor') || undefined;

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    const convex = getConvexClientFromRequest(request);
    const comments = await convex.query((api as any).queries.videoComments.getVideoComments, {
      videoId,
      limit,
      cursor,
    });

    return ResponseFactory.success(comments, 'Comments retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Comments retrieval error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to retrieve comments'));
  }
}

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/comments:
 *   post:
 *     summary: Add comment to video
 *     description: Adds a new comment to a video post
 *     tags: [Nosh Heaven, Videos, Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
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
 *                 description: Comment content
 *                 example: "Great recipe! Can't wait to try it."
 *               parentCommentId:
 *                 type: string
 *                 description: ID of parent comment for replies
 *                 example: "j1234567890abcdef"
 *     responses:
 *       201:
 *         description: Comment added successfully
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
 *                     commentId:
 *                       type: string
 *                       description: ID of the created comment
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Comment added successfully"
 *       400:
 *         description: Validation error
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
    const body = await request.json();

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    if (!body.content || body.content.trim().length === 0) {
      return ResponseFactory.validationError('Comment content is required');
    }

    // Get user from session token
    const convex = getConvexClientFromRequest(request);
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Add comment
    const commentId = await convex.mutation((api as any).mutations.videoComments.addComment, {
      videoId,
      content: body.content.trim(),
      parentCommentId: body.parentCommentId,
    });

    return ResponseFactory.success({
      commentId,
    }, 'Comment added successfully', 201);

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Comment creation error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to add comment'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  return handleGET(request, { params: { videoId } });
}));
export const POST = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  return handlePOST(request, { params: { videoId } });
}));
