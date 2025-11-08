import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from "@/convex/_generated/api";
import { withAdminAuth } from '../../../../../lib/api/admin-middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /functions/admin/forceEndLiveSession:
 *   post:
 *     summary: Force End Live Session (Admin)
 *     description: Immediately terminate a live streaming session for administrative purposes. This endpoint allows administrators to end sessions due to policy violations, technical issues, or other administrative reasons. The action is logged for audit purposes.
 *     tags: [Admin, Live Streaming, Moderation]
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
 *                 description: Channel name or session ID to terminate
 *                 example: "chef_mario_cooking"
 *               reason:
 *                 type: string
 *                 description: Administrative reason for ending the session
 *                 example: "Content policy violation - inappropriate language"
 *               adminId:
 *                 type: string
 *                 description: Admin user ID performing the action (auto-populated from auth)
 *                 example: "j1234567890abcdef"
 *               notifyChef:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify the chef about the session termination
 *                 example: true
 *               notifyViewers:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify viewers about the session termination
 *                 example: true
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Additional metadata for audit purposes
 *                 example: {"violationType": "language", "severity": "high", "previousWarnings": 2}
 *     responses:
 *       200:
 *         description: Live session terminated successfully
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
 *                     sessionId:
 *                       type: string
 *                       description: ID of the terminated session
 *                       example: "session_123"
 *                     channelName:
 *                       type: string
 *                       description: Channel name that was terminated
 *                       example: "chef_mario_cooking"
 *                     chefId:
 *                       type: string
 *                       description: Chef ID whose session was terminated
 *                       example: "j0987654321fedcba"
 *                     terminatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when session was terminated
 *                       example: "2024-01-15T14:30:00Z"
 *                     reason:
 *                       type: string
 *                       description: Reason provided for termination
 *                       example: "Content policy violation - inappropriate language"
 *                     adminId:
 *                       type: string
 *                       description: Admin ID who performed the termination
 *                       example: "j1234567890abcdef"
 *                     sessionDuration:
 *                       type: number
 *                       description: Duration of session before termination (minutes)
 *                       example: 45
 *                     finalViewerCount:
 *                       type: number
 *                       description: Number of viewers when session was terminated
 *                       example: 25
 *                     notificationsSent:
 *                       type: object
 *                       properties:
 *                         chefNotified:
 *                           type: boolean
 *                           description: Whether chef was notified
 *                           example: true
 *                         viewersNotified:
 *                           type: boolean
 *                           description: Whether viewers were notified
 *                           example: true
 *                         notificationCount:
 *                           type: number
 *                           description: Number of notifications sent
 *                           example: 26
 *                 message:
 *                   type: string
 *                   example: "Live session terminated successfully"
 *       400:
 *         description: Bad request - missing required fields or invalid channel name
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
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Live session not found or already ended
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
    const { channelName, reason, adminId } = await req.json();

    if (!channelName || !reason) {
      return ResponseFactory.validationError('Missing required fields');
    }

    const result = await client.mutation(api.mutations.liveSessions.endLiveSession, {
      sessionId: channelName as any, // Using channelName as sessionId for now
      reason,
    });

    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    logger.error('Error force ending live session:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const POST = withAdminAuth(handlePOST);