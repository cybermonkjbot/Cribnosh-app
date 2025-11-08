import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}:
 *   get:
 *     summary: Get video by ID
 *     description: Retrieves a specific video post by its ID
 *     tags: [Nosh Heaven, Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video post
 *     responses:
 *       200:
 *         description: Video retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VideoPost'
 *                 message:
 *                   type: string
 *                   example: "Video retrieved successfully"
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
): Promise<NextResponse> {
  try {
    const { videoId } = params;

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    const convex = getConvexClientFromRequest(request);
    const video = await convex.query((api as any).queries.videoPosts.getVideoById, { videoId });

    if (!video) {
      return ResponseFactory.notFound('Video not found');
    }

    return ResponseFactory.success(video, 'Video retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Video retrieval error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to retrieve video'));
  }
}

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}:
 *   put:
 *     summary: Update video post
 *     description: Updates an existing video post
 *     tags: [Nosh Heaven, Videos]
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Video Title"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["updated", "tags"]
 *               cuisine:
 *                 type: string
 *                 example: "Mexican"
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: "beginner"
 *               visibility:
 *                 type: string
 *                 enum: [public, followers, private]
 *                 example: "public"
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Video not found
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
    await convex.mutation((api as any).mutations.videoPosts.updateVideoPost, {
      videoId,
      title: body.title,
      description: body.description,
      tags: body.tags,
      cuisine: body.cuisine,
      difficulty: body.difficulty,
      visibility: body.visibility,
    });

    return ResponseFactory.success(null, 'Video updated successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Video update error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update video'));
  }
}

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}:
 *   delete:
 *     summary: Delete video post
 *     description: Soft deletes a video post
 *     tags: [Nosh Heaven, Videos]
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
 *         description: Video deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
    const convex = getConvexClientFromRequest(request);
    const user = await getUserFromRequest(request);

    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Delete video post
    await convex.mutation((api as any).mutations.videoPosts.deleteVideoPost, {
      videoId,
    });

    return ResponseFactory.success(null, 'Video deleted successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Video deletion error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to delete video'));
  }
}

// Wrapper functions to extract params from URL
export const GET = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[4]; // Extract videoId from /api/nosh-heaven/videos/[videoId]
  return handleGET(request, { params: { videoId } });
}));

export const PUT = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[4]; // Extract videoId from /api/nosh-heaven/videos/[videoId]
  return handlePUT(request, { params: { videoId } });
}));

export const DELETE = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[4]; // Extract videoId from /api/nosh-heaven/videos/[videoId]
  return handleDELETE(request, { params: { videoId } });
}));
