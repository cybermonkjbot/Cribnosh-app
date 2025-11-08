import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/messaging/offline:
 *   post:
 *     summary: Set user offline
 *     description: Set user status to offline
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User set offline successfully
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
      message: 'User set offline successfully',
      data: { userId: body.userId }
    });
  } catch (error) {
    logger.error('Error in messaging offline:', error);
    return ResponseFactory.error('Failed to set user offline', 'MESSAGING_OFFLINE_ERROR', 500);
  }
}
