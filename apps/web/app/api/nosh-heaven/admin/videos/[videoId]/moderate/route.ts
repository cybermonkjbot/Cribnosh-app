import { NextRequest, NextResponse } from 'next/server';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAdminAuth } from '@/lib/api/admin-middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/nosh-heaven/admin/videos/{videoId}/moderate:
 *   post:
 *     summary: Moderate video
 *     description: Admin action to moderate a video (approve, reject, flag)
 *     tags: [Nosh Heaven, Admin, Videos]
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, flag, remove]
 *                 description: Moderation action to take
 *                 example: "approve"
 *               reason:
 *                 type: string
 *                 description: Reason for the action
 *                 example: "Content violates community guidelines"
 *               notes:
 *                 type: string
 *                 description: Additional notes for the moderation
 *                 example: "Contains inappropriate language"
 *     responses:
 *       200:
 *         description: Video moderated successfully
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
 *                   example: "Video moderated successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
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

    if (!body.action || !['approve', 'reject', 'flag', 'remove'].includes(body.action)) {
      return ResponseFactory.validationError('Valid action is required (approve, reject, flag, remove)');
    }

    const convex = getConvexClientFromRequest(request);

    // Get video to check if it exists
    const video = await convex.query((api as any).queries.videoPosts.getVideoById, { videoId });
    if (!video) {
      return ResponseFactory.notFound('Video not found');
    }

    // Update video status based on action
    let newStatus;
    switch (body.action) {
      case 'approve':
        newStatus = 'published';
        break;
      case 'reject':
        newStatus = 'archived';
        break;
      case 'flag':
        newStatus = 'flagged';
        break;
      case 'remove':
        newStatus = 'removed';
        break;
      default:
        return ResponseFactory.validationError('Invalid action');
    }

    await convex.mutation((api as any).mutations.videoPosts.updateVideoPost, {
      videoId,
      // We'll need to add status to the update mutation
    });

    // Log moderation action
    await convex.mutation((api as any).mutations.admin.logActivity, {
      action: `video_${body.action}`,
      details: {
        videoId,
        reason: body.reason,
        notes: body.notes,
        previousStatus: video.status,
        newStatus,
      },
    });

    return ResponseFactory.success(null, 'Video moderated successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Video moderation error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to moderate video'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(withAdminAuth(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[5]; // Extract videoId from /api/nosh-heaven/admin/videos/[videoId]/moderate
  return handlePOST(request, { params: { videoId } });
})));
