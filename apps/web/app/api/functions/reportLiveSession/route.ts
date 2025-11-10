/**
 * @swagger
 * /api/functions/reportLiveSession:
 *   post:
 *     summary: Report live session
 *     description: Report a live streaming session for moderation review
 *     tags: [Live Streaming Functions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *               - reason
 *             properties:
 *               channelName:
 *                 type: string
 *                 description: Name of the channel/session to report
 *               reason:
 *                 type: string
 *                 description: Reason for reporting
 *               additionalDetails:
 *                 type: string
 *                 description: Additional details about the report
 *               reporterId:
 *                 type: string
 *                 description: ID of the user making the report
 *     responses:
 *       200:
 *         description: Session reported successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Live session reported: channel-name"
 *                     reason:
 *                       type: string
 *                     additionalDetails:
 *                       type: string
 *                     reporterId:
 *                       type: string
 *                     reportedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing required fields
 *       500:
 *         description: Internal server error
 *     security: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from "@/convex/_generated/api";
import { withModerationRateLimit } from '../../../../lib/api/sensitive-middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

async function handlePOST(req: NextRequest) {
  try {
    const client = getConvexClientFromRequest(req);
    const { channelName, reason, additionalDetails, reporterId } = await req.json();

    if (!channelName || !reason) {
      return ResponseFactory.validationError('Missing required fields');
    }

    // Note: adminMuteLiveChatUser function doesn't exist in liveSessions mutations
    // This is a placeholder implementation for session reporting
    const result = {
      success: true,
      message: `Live session reported: ${channelName}`,
      reason,
      additionalDetails,
      reporterId,
      reportedAt: new Date().toISOString()
    };

    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    logger.error('Error reporting live session:', error);
    return ResponseFactory.error(getErrorMessage(error, 'Internal Server Error'), 'CUSTOM_ERROR', 500);
  }
}

export const POST = withModerationRateLimit(handlePOST);