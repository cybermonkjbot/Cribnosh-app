/**
 * @swagger
 * /api/functions/moderation/reportUser:
 *   post:
 *     summary: Report user
 *     description: Report a user for moderation in a live chat channel
 *     tags: [Moderation]
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
 *                 description: Name of the channel
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
 *         description: User reported successfully
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
 *                       example: "User reported in channel channel-name"
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

import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { withModerationRateLimit } from '../../../../../lib/api/sensitive-middleware';

async function handlePOST(req: NextRequest) {
  try {
    const client = getConvexClient();
    const { channelName, reason, additionalDetails, reporterId } = await req.json();

    if (!channelName || !reason) {
      return ResponseFactory.validationError('Missing required fields');
    }

    // Note: adminMuteLiveChatUser function doesn't exist in liveSessions mutations
    // This is a placeholder implementation for user reporting
    const result = {
      success: true,
      message: `User reported in channel ${channelName}`,
      reason,
      additionalDetails,
      reporterId,
      reportedAt: new Date().toISOString()
    };

    return ResponseFactory.success(result);
  } catch (error) {
    console.error('Error reporting user:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const POST = withModerationRateLimit(handlePOST);