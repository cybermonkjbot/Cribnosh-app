import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /chat/conversations/{chat_id}/remove:
 *   post:
 *     summary: Remove Participant from Chat
 *     description: Remove a participant from a chat conversation. This endpoint allows chat administrators or authorized users to kick/remove other participants from the conversation, maintaining chat moderation and user management.
 *     tags: [Chat, Conversations, Moderation]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat conversation ID
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - removeUserId
 *             properties:
 *               removeUserId:
 *                 type: string
 *                 description: ID of the user to remove from the chat
 *                 example: "j1234567890abcdef"
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 description: Reason for removing the user
 *                 example: "Violation of chat rules"
 *               notifyUser:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify the removed user
 *                 example: true
 *     responses:
 *       200:
 *         description: Participant removed successfully
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
 *                     chatId:
 *                       type: string
 *                       description: Chat conversation ID
 *                       example: "j1234567890abcdef"
 *                     removedUserId:
 *                       type: string
 *                       description: ID of the removed user
 *                       example: "j1234567890abcdef"
 *                     removedBy:
 *                       type: string
 *                       description: ID of the user who performed the removal
 *                       example: "admin1234567890abcdef"
 *                     removedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when user was removed
 *                       example: "2024-01-15T14:30:00Z"
 *                     remainingParticipants:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of remaining participant IDs
 *                       example: ["user1", "user2", "admin"]
 *                     participantCount:
 *                       type: integer
 *                       description: Number of remaining participants
 *                       example: 3
 *                     notificationSent:
 *                       type: boolean
 *                       description: Whether removal notification was sent
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing removeUserId or invalid chat_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to remove participants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat conversation not found
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

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user || !user._id) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  // Extract chat_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/conversations\/([^/]+)/);
  const chatId = match ? (match[1] as Id<'chats'>) : undefined;
  if (!chatId) {
    return ResponseFactory.validationError('Missing chat_id');
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON');
  }
  const { removeUserId } = body;
  if (!removeUserId) {
    return ResponseFactory.validationError('Missing removeUserId');
  }
  const convex = getConvexClient();
  const result = await convex.mutation(api.mutations.chats.removeParticipant, {
    chatId,
    userId: user._id,
    removeUserId
  });
  return ResponseFactory.success(result);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
