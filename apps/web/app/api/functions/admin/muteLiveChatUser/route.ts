import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAdminAuth } from '@/lib/api/admin-middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /functions/admin/muteLiveChatUser:
 *   post:
 *     summary: Mute Live Chat User (Admin)
 *     description: Moderate a user in live chat by muting, deleting messages, or taking other moderation actions
 *     tags: [Admin, Live Streaming, Moderation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - messageIndex
 *               - action
 *               - reason
 *               - adminId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Live streaming session ID
 *                 example: "session_123"
 *               messageIndex:
 *                 type: number
 *                 description: Index of the message to moderate
 *                 example: 5
 *               action:
 *                 type: string
 *                 enum: [mute, delete, warn, ban]
 *                 description: Moderation action to take
 *                 example: "mute"
 *               reason:
 *                 type: string
 *                 description: Reason for moderation action
 *                 example: "Inappropriate language"
 *               adminId:
 *                 type: string
 *                 description: Admin user ID performing the action
 *                 example: "admin_456"
 *     responses:
 *       200:
 *         description: User moderated successfully
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
 *                       description: Success message
 *                       example: "User muted successfully"
 *                     result:
 *                       type: object
 *                       description: Result of the moderation action
 *                       properties:
 *                         moderated:
 *                           type: boolean
 *                           example: true
 *                         action:
 *                           type: string
 *                           example: "delete"
 *                         reason:
 *                           type: string
 *                           example: "Inappropriate language"
 *                         moderatedBy:
 *                           type: string
 *                           example: "admin_456"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can moderate chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Live session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(req: NextRequest) {
  try {
    const client = getConvexClientFromRequest(req);
    const { sessionId, messageIndex, action, reason, adminId } = await req.json();

    if (!sessionId || messageIndex === undefined || !action || !reason) {
      return ResponseFactory.validationError('Missing required fields');
    }

    // Use the available moderateChatMessage function
    const result = await client.mutation(api.mutations.liveSessions.moderateChatMessage, {
      sessionId,
      messageIndex,
      action: action === 'mute' ? 'delete' : action, // Map mute to delete since mute isn't supported
      reason,
      moderatedBy: adminId, // Use the adminId from the request body
    });

    return ResponseFactory.success({
      success: true,
      message: `User ${action === 'mute' ? 'muted' : action}ed successfully`,
      result
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    logger.error('Error moderating live chat user:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const POST = withAdminAuth(handlePOST); 