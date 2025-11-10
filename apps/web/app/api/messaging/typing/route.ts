import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/messaging/typing:
 *   post:
 *     summary: Update typing status
 *     description: Update user typing status
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *               isTyping:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Typing status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return ResponseFactory.success({ 
      message: 'Typing status updated successfully',
      data: { 
        chatId: body.chatId,
        isTyping: body.isTyping
      }
    });
  } catch (error) {
    logger.error('Error in messaging typing:', error);
    return ResponseFactory.error('Failed to update typing status', 'MESSAGING_TYPING_ERROR', 500);
  }
}
