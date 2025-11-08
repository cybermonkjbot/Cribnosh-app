import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Welcome Endpoint
 *     description: Welcome endpoint that confirms the API is working and accessible
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is working successfully
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
 *                     message:
 *                       type: string
 *                       example: "Welcome to the CribNosh API! The API is working."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *     security: []
 */
export async function GET(request: NextRequest) {
  return ResponseFactory.success({ message: 'Welcome to the CribNosh API! The API is working.' });
} 