import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/view:
 *   post:
 *     summary: Record video view
 *     description: Records a video view event for analytics
 *     tags: [Nosh Heaven, Videos, Analytics]
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
 *               - watchDuration
 *               - completionRate
 *             properties:
 *               watchDuration:
 *                 type: number
 *                 description: Duration watched in seconds
 *                 example: 120
 *               completionRate:
 *                 type: number
 *                 description: Percentage of video watched (0-100)
 *                 example: 75.5
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "mobile"
 *                   os:
 *                     type: string
 *                     example: "iOS"
 *                   browser:
 *                     type: string
 *                     example: "Safari"
 *               location:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                     example: "US"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *               sessionId:
 *                 type: string
 *                 description: Session ID for anonymous users
 *                 example: "sess_1234567890"
 *     responses:
 *       200:
 *         description: View recorded successfully
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
 *                   example: "View recorded successfully"
 *       400:
 *         description: Bad request
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

    if (!body.watchDuration || body.completionRate === undefined) {
      return ResponseFactory.validationError('watchDuration and completionRate are required');
    }

    // Validate completion rate
    if (body.completionRate < 0 || body.completionRate > 100) {
      return ResponseFactory.validationError('completionRate must be between 0 and 100');
    }

    // Get user from token (optional for anonymous views)
    let user = null;
    const convex = getConvexClientFromRequest(request);
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      user = await convex.query(api.queries.users.getUserByToken, { token });
    }

    // Record view
    await convex.mutation((api as any).mutations.videoPosts.recordVideoView, {
      videoId,
      watchDuration: body.watchDuration,
      completionRate: body.completionRate,
      deviceInfo: body.deviceInfo,
      location: body.location,
      sessionId: body.sessionId,
    });

    return ResponseFactory.success(null, 'View recorded successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Video view recording error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to record view'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  return handlePOST(request, { params: { videoId } });
}));
