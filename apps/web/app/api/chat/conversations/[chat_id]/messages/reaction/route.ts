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
 * /chat/conversations/{chat_id}/messages/reaction:
 *   post:
 *     summary: Add or Remove Message Reaction
 *     description: Add or remove an emoji reaction to a specific message in a chat conversation. This endpoint allows users to express their emotions and responses to messages through emoji reactions, enhancing communication and engagement.
 *     tags: [Chat, Conversations, Messages, Reactions]
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
 *               - emoji
 *               - action
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message to react to
 *                 example: "msg_1234567890abcdef"
 *               emoji:
 *                 type: string
 *                 description: Emoji to add or remove
 *                 example: "👍"
 *               action:
 *                 type: string
 *                 enum: [add, remove]
 *                 description: Whether to add or remove the reaction
 *                 example: "add"
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional reaction metadata
 *                 example:
 *                   deviceType: "mobile"
 *                   timestamp: "2024-01-15T14:30:00Z"
 *     responses:
 *       200:
 *         description: Message reaction updated successfully
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
 *                       description: ID of the message that was reacted to
 *                       example: "msg_1234567890abcdef"
 *                     emoji:
 *                       type: string
 *                       description: Emoji that was added or removed
 *                       example: "👍"
 *                     action:
 *                       type: string
 *                       enum: [add, remove]
 *                       description: Action that was performed
 *                       example: "add"
 *                     userId:
 *                       type: string
 *                       description: ID of the user who performed the reaction
 *                       example: "j1234567890abcdef"
 *                     reactedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the reaction was added/removed
 *                       example: "2024-01-15T14:30:00Z"
 *                     reactionCount:
 *                       type: integer
 *                       description: Total number of reactions on this message
 *                       example: 5
 *                     emojiCount:
 *                       type: integer
 *                       description: Number of reactions with this specific emoji
 *                       example: 3
 *                     allReactions:
 *                       type: object
 *                       nullable: true
 *                       description: All reactions on the message grouped by emoji
 *                       properties:
 *                         "👍":
 *                           type: integer
 *                           example: 3
 *                         "❤️":
 *                           type: integer
 *                           example: 2
 *                         "😂":
 *                           type: integer
 *                           example: 1
 *                     userReactions:
 *                       type: array
 *                       nullable: true
 *                       description: Reactions added by the current user
 *                       items:
 *                         type: string
 *                       example: ["👍", "❤️"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields or invalid action
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
  const { messageId, emoji, action } = body;
  if (!messageId || !emoji || !['add', 'remove'].includes(action)) {
    return ResponseFactory.validationError('Missing or invalid messageId, emoji, or action');
  }
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  const result = await convex.mutation(api.mutations.chats.reactToMessage, {
    chatId,
    messageId,
    userId: user._id,
    emoji,
    action,
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success(result);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
