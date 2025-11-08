import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /api/messaging/online:
 *   get:
 *     summary: Get online users
 *     description: Get list of online users
 *     tags: [Messaging]
 *     responses:
 *       200:
 *         description: Online users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    return ResponseFactory.success({ 
      message: 'Online users retrieved successfully',
      data: []
    });
  } catch (error) {
    console.error('Error in messaging online:', error);
    return ResponseFactory.error('Failed to retrieve online users', 'MESSAGING_ONLINE_ERROR', 500);
  }
}
