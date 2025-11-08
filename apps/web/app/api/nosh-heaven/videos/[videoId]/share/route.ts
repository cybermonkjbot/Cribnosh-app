import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getUserFromRequest } from '@/lib/auth/session';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/share:
 *   post:
 *     summary: Share a video
 *     description: Records a video share event
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [internal, facebook, twitter, instagram, whatsapp, other]
 *                 default: "internal"
 *                 description: Platform where the video was shared
 *                 example: "facebook"
 *     responses:
 *       200:
 *         description: Video shared successfully
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
 *                   example: "Video shared successfully"
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
    const body = await request.json();

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    // Get user from session token
    const convex = getConvexClient();
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Share video
    await convex.mutation((api as any).mutations.videoPosts.shareVideo, {
      videoId,
      platform: body.platform || 'internal',
    });

    return ResponseFactory.success(null, 'Video shared successfully');

  } catch (error: any) {
    console.error('Video share error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to share video');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split("/")[4];
  return handlePOST(request, { params: { videoId } });
}));
