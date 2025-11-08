import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /chat/order/{order_id}/read:
 *   post:
 *     summary: Mark Order Chat Messages as Read
 *     description: Mark all unread messages in an order-related chat conversation as read. This endpoint allows users to update their read status for order communications, clearing unread indicators and updating message status.
 *     tags: [Chat, Orders, Read]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to mark chat messages as read
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Order chat messages marked as read successfully
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
 *                     chat:
 *                       type: object
 *                       description: Chat conversation details
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Chat ID
 *                           example: "j1234567890abcdef"
 *                         participants:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Chat participants
 *                           example: ["user1", "user2"]
 *                         metadata:
 *                           type: object
 *                           additionalProperties: true
 *                           description: Chat metadata
 *                           example:
 *                             order_id: "j1234567890abcdef"
 *                             type: "order_chat"
 *                     messages:
 *                       type: array
 *                       description: All messages in the chat
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "msg_1234567890abcdef"
 *                           senderId:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           content:
 *                             type: string
 *                             example: "Thank you for the delicious meal!"
 *                           createdAt:
 *                             type: number
 *                             example: 1705324800000
 *                           isRead:
 *                             type: boolean
 *                             example: true
 *                           metadata:
 *                             type: object
 *                             additionalProperties: true
 *                             example: {}
 *                     total_count:
 *                       type: integer
 *                       description: Total number of messages
 *                       example: 25
 *                     limit:
 *                       type: integer
 *                       description: Message limit applied
 *                       example: 100
 *                     offset:
 *                       type: integer
 *                       description: Message offset applied
 *                       example: 0
 *                     markedAsRead:
 *                       type: integer
 *                       description: Number of messages marked as read
 *                       example: 5
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing order_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user not authorized for this order chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat not found for order_id
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
  // Extract order_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/order\/([^/]+)/);
  const order_id = match ? match[1] : undefined;
  if (!order_id) {
    return ResponseFactory.validationError('Missing order_id');
  }
  // Get authenticated user from session token
  const { userId, user } = await getAuthenticatedUser(request);
  const convex = getConvexClient();
  const chatsResult = await convex.query(api.queries.chats.listConversationsForUser, { userId: userId });
  const chat = chatsResult.chats.find((c: any) => c.metadata && c.metadata.order_id === order_id);
  if (!chat) {
    return ResponseFactory.notFound('Chat not found for order_id');
  }
  // Only allow if user is a participant or admin
  const isParticipant = Array.isArray(chat.participants) && chat.participants.includes(userId);
  if (!isParticipant && user.roles?.[0] !== 'admin') {
    return ResponseFactory.forbidden('Forbidden: Not a participant or admin.');
  }
  const messagesResult = await convex.query(api.queries.chats.listMessagesForChat, { chatId: chat._id });
  const chatMessages = messagesResult.messages.filter((m: any) => !m.isRead);
  for (const msg of chatMessages) {
    await convex.mutation(api.mutations.chats.editMessage, { chatId: chat._id, messageId: msg._id, userId: msg.senderId, metadata: { ...msg.metadata, isRead: true } });
  }
  // Return schema-compliant response
  return ResponseFactory.success({
    chat: chat,
    messages: messagesResult.messages,
    total_count: messagesResult.total_count,
    limit: messagesResult.limit,
    offset: messagesResult.offset
  });
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
