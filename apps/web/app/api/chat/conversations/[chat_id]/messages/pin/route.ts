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
 * /chat/conversations/{chat_id}/messages/pin:
 *   post:
 *     summary: Pin or Unpin Chat Message
 *     description: Pin or unpin a specific message in a chat conversation. This endpoint allows users to mark important messages as pinned for easy reference, or unpin previously pinned messages. Pinned messages are typically displayed at the top of the conversation.
 *     tags: [Chat, Conversations, Messages, Pin]
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
 *               - messageId
 *               - pin
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message to pin or unpin
 *                 example: "msg_1234567890abcdef"
 *               pin:
 *                 type: boolean
 *                 description: Whether to pin (true) or unpin (false) the message
 *                 example: true
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 description: Reason for pinning/unpinning the message
 *                 example: "Important announcement"
 *     responses:
 *       200:
 *         description: Message pin status updated successfully
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
 *                     messageId:
 *                       type: string
 *                       description: ID of the message that was pinned/unpinned
 *                       example: "msg_1234567890abcdef"
 *                     pinned:
 *                       type: boolean
 *                       description: Current pin status of the message
 *                       example: true
 *                     pinnedBy:
 *                       type: string
 *                       description: ID of the user who performed the pin action
 *                       example: "j1234567890abcdef"
 *                     pinnedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the message was pinned/unpinned
 *                       example: "2024-01-15T14:30:00Z"
 *                     reason:
 *                       type: string
 *                       nullable: true
 *                       description: Reason for pinning/unpinning
 *                       example: "Important announcement"
 *                     pinnedMessagesCount:
 *                       type: integer
 *                       description: Total number of pinned messages in the conversation
 *                       example: 3
 *                     messageContent:
 *                       type: string
 *                       nullable: true
 *                       description: Content of the pinned message
 *                       example: "Welcome to our cooking session!"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing messageId or invalid pin value
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
 *         description: Forbidden - insufficient permissions to pin messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat conversation or message not found
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
  const { messageId, pin } = body;
  if (!messageId || typeof pin !== 'boolean') {
    return ResponseFactory.validationError('Missing or invalid messageId or pin');
  }
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  const result = await convex.mutation(api.mutations.chats.pinMessage, {
    chatId,
    messageId,
    userId: user._id,
    pin,
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success(result);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
