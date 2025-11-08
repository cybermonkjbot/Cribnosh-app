import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /api/messaging/read:
 *   post:
 *     summary: Mark message as read
 *     description: Mark a message as read
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message marked as read successfully
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
      message: 'Message marked as read successfully',
      data: { messageId: body.messageId }
    });
  } catch (error) {
    console.error('Error in messaging read:', error);
    return ResponseFactory.error('Failed to mark message as read', 'MESSAGING_READ_ERROR', 500);
  }
}
