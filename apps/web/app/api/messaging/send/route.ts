import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
  const convex = getConvexClient();
  
  try {
    const body = await request.json();
    const { content, chatId, replyTo, attachments } = body;
    
    // Validate required fields
    if (!content || !chatId) {
      return ResponseFactory.error('Content and chatId are required', 'VALIDATION_ERROR', 400);
    }
    
    // Get user from JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return ResponseFactory.error('Authorization token required', 'AUTH_ERROR', 401);
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    // Send message
    const messageId = await convex.mutation(api.mutations.chats.sendMessage, {
      content,
      chatId,
      senderId: userId,
      metadata: {
        replyTo,
        attachments: attachments || []
      }
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
  } catch (error) {
    console.error('Error in messaging send:', error);
    return ResponseFactory.error('Failed to send message', 'MESSAGING_SEND_ERROR', 500);
  }
});
