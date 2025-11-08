import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { Id } from '@/convex/_generated/dataModel';
import { getUserFromRequest } from '@/lib/auth/session';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/report:
 *   post:
 *     summary: Report video
 *     description: Report a video for inappropriate content
 *     tags: [Nosh Heaven]
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
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [inappropriate_content, spam, harassment, violence, copyright, other]
 *                 description: Reason for reporting
 *               description:
 *                 type: string
 *                 description: Additional details about the report
 *               timestamp:
 *                 type: number
 *                 description: Specific timestamp in video (optional)
 *     responses:
 *       200:
 *         description: Video reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest, { params }: { params: { videoId: string } }) {
  const convex = getConvexClient();
  
  try {
    const body = await request.json();
    const { reason, description, timestamp } = body;
    
    // Validate required fields
    if (!reason) {
      return ResponseFactory.error('Reason is required', 'VALIDATION_ERROR', 400);
    }
    
    // Get authenticated user from session token
    const { userId } = await getAuthenticatedUser(request);
    
    // Create report
    await convex.mutation((api as any).mutations.videoPosts.flagVideo, {
      videoId: params.videoId as any,
      reason,
      description: description || ''
    });
    
    return ResponseFactory.success({
      data: {
        videoId: params.videoId,
        reason,
        description,
        timestamp,
        reportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in video report:', error);
    return ResponseFactory.error('Failed to report video', 'VIDEO_REPORT_ERROR', 500);
  }
}

// Wrapper function to extract params from URL
export const POST = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[4]; // Extract videoId from /api/nosh-heaven/videos/[videoId]/report
  return handlePOST(request, { params: { videoId } });
});
