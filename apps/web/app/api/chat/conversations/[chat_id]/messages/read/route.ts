import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /chat/conversations/{chat_id}/messages/read:
 *   post:
 *     summary: Mark Chat Messages as Read
 *     description: Mark all unread messages in a chat conversation as read for the authenticated user. This endpoint allows users to update their read status for messages in a specific conversation, clearing unread indicators and updating message status.
 *     tags: [Chat, Conversations, Messages, Read]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat conversation ID
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
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
 *                     userId:
 *                       type: string
 *                       description: ID of the user who marked messages as read
 *                       example: "j1234567890abcdef"
 *                     markedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when messages were marked as read
 *                       example: "2024-01-15T14:30:00Z"
 *                     messagesMarked:
 *                       type: integer
 *                       description: Number of messages marked as read
 *                       example: 5
 *                     totalMessages:
 *                       type: integer
 *                       description: Total number of messages in the conversation
 *                       example: 25
 *                     unreadCount:
 *                       type: integer
 *                       description: Remaining unread messages count
 *                       example: 0
 *                     lastReadMessageId:
 *                       type: string
 *                       nullable: true
 *                       description: ID of the last read message
 *                       example: "msg_1234567890abcdef"
 *                     readStatus:
 *                       type: object
 *                       nullable: true
 *                       description: Detailed read status information
 *                       properties:
 *                         allRead:
 *                           type: boolean
 *                           example: true
 *                         readPercentage:
 *                           type: number
 *                           example: 100.0
 *                         oldestUnread:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing chat_id
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
 *       404:
 *         description: Chat conversation not found or user not a participant
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
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  const result = await convex.mutation(api.mutations.chats.markMessagesRead, {
    chatId,
    userId: user._id,
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success(result);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
