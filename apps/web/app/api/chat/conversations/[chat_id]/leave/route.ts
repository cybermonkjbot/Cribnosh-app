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
 * /chat/conversations/{chat_id}/leave:
 *   post:
 *     summary: Leave Chat Conversation
 *     description: Leave a chat conversation. This endpoint allows users to voluntarily exit a chat conversation, removing themselves from the participant list. If the user is the last participant, the conversation may be deleted.
 *     tags: [Chat, Conversations, Participation]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat conversation ID to leave
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Successfully left the chat conversation
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
 *                     leftUserId:
 *                       type: string
 *                       description: ID of the user who left
 *                       example: "j1234567890abcdef"
 *                     leftAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when user left
 *                       example: "2024-01-15T14:30:00Z"
 *                     remainingParticipants:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of remaining participant IDs
 *                       example: ["user1", "user2"]
 *                     participantCount:
 *                       type: integer
 *                       description: Number of remaining participants
 *                       example: 2
 *                     conversationDeleted:
 *                       type: boolean
 *                       description: Whether the conversation was deleted (if last participant)
 *                       example: false
 *                     newAdmin:
 *                       type: string
 *                       nullable: true
 *                       description: New admin if admin left and transferred rights
 *                       example: "user1"
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
  const result = await convex.mutation(api.mutations.chats.leaveConversation, {
    chatId,
    userId: user._id,
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success(result);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
