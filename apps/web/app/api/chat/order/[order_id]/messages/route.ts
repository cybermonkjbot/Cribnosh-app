import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /chat/order/{order_id}/messages:
 *   get:
 *     summary: Get Order Chat Messages
 *     description: Retrieve all messages from the chat conversation associated with a specific order. This endpoint allows customers, chefs, and admins to view the complete message history for order-related communications.
 *     tags: [Chat, Orders, Messages]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to get chat messages for
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of messages to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of messages to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Order chat messages retrieved successfully
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
 *                     chat_id:
 *                       type: string
 *                       description: Chat conversation ID
 *                       example: "j1234567890abcdef"
 *                     messages:
 *                       type: array
 *                       description: Array of chat messages
 *                       items:
 *                         type: object
 *                         properties:
 *                           message_id:
 *                             type: string
 *                             description: Message ID
 *                             example: "msg_1234567890abcdef"
 *                           sender_id:
 *                             type: string
 *                             description: ID of the message sender
 *                             example: "j1234567890abcdef"
 *                           content:
 *                             type: string
 *                             description: Message content
 *                             example: "Thank you for the delicious meal!"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Message creation timestamp
 *                             example: "2024-01-15T14:30:00Z"
 *                           is_read:
 *                             type: boolean
 *                             description: Whether the message has been read
 *                             example: true
 *                           file_url:
 *                             type: string
 *                             nullable: true
 *                             description: URL of attached file
 *                             example: "https://storage.example.com/file.pdf"
 *                           file_type:
 *                             type: string
 *                             nullable: true
 *                             description: Type of attached file
 *                             example: "application/pdf"
 *                           file_name:
 *                             type: string
 *                             nullable: true
 *                             description: Name of attached file
 *                             example: "receipt.pdf"
 *                           file_size:
 *                             type: integer
 *                             nullable: true
 *                             description: Size of attached file in bytes
 *                             example: 1024000
 *                           metadata:
 *                             type: object
 *                             additionalProperties: true
 *                             description: Additional message metadata
 *                             example: {}
 *                     total_count:
 *                       type: integer
 *                       description: Total number of messages in the chat
 *                       example: 25
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

async function handleGET(request: NextRequest): Promise<NextResponse> {
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
  const sessionToken = getSessionTokenFromRequest(request);
  // Find the chat for this order
  const chats = await convex.query(api.queries.chats.listConversationsForUser, {
    userId: userId,
    sessionToken: sessionToken || undefined
  });
  const chat = chats.chats.find((c: any) => c.metadata && c.metadata.order_id === order_id);
  if (!chat) {
    return ResponseFactory.notFound('Chat not found for order_id');
  }
  // Only allow if user is a participant or admin
  const isParticipant = Array.isArray(chat.participants) && chat.participants.includes(userId);
  if (!isParticipant && user.roles?.[0] !== 'admin') {
    return ResponseFactory.forbidden('Forbidden: Not a participant or admin.');
  }
  const { messages } = await convex.query(api.queries.chats.listMessagesForChat, {
    chatId: chat._id,
    limit: 100,
    sessionToken: sessionToken || undefined
  });
  const chatMessages = messages.sort((a: any, b: any) => a.createdAt - b.createdAt);
  return ResponseFactory.success({
    chat_id: chat._id,
    messages: chatMessages.map((m: any) => ({
      message_id: m._id,
      sender_id: m.senderId,
      content: m.content,
      created_at: new Date(m.createdAt).toISOString(),
      is_read: m.isRead || false,
      file_url: m.fileUrl || null,
      file_type: m.fileType || null,
      file_name: m.fileName || null,
      file_size: m.fileSize || null,
      metadata: m.metadata || {},
    })),
    total_count: chatMessages.length,
  });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
