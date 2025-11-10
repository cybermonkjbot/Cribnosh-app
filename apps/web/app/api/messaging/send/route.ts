import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
/**
 * @swagger
 * /api/messaging/send:
 *   post:
 *     summary: Send message
 *     description: Send a message to a chat
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - chatId
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               chatId:
 *                 type: string
 *                 description: Chat ID
 *               replyTo:
 *                 type: string
 *                 description: Message ID to reply to
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Message attachments
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { content, chatId, replyTo, attachments } = body;
    
    // Validate required fields
    if (!content || !chatId) {
      return ResponseFactory.error('Content and chatId are required', 'VALIDATION_ERROR', 400);
    }
    
    // Get authenticated user from session token
    const { userId } = await getAuthenticatedUser(request);
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Send message
    const messageId = await convex.mutation(api.mutations.chats.sendMessage, {
      content,
      chatId,
      senderId: userId,
      metadata: {
        replyTo,
        attachments: attachments || []
      },
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({
      data: {
        messageId,
        content,
        chatId,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error in messaging send:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to send message.'));
  }
});
