import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /auth/token:
 *   get:
 *     summary: Get Session Token
 *     description: Retrieve the current session token from cookies
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Session token retrieved successfully
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
 *                     sessionToken:
 *                       type: string
 *                       nullable: true
 *                       description: Current session token or null if not authenticated
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

export async function GET(request: NextRequest) {
  const token = request.cookies.get('convex-auth-token')?.value || null;
  return ResponseFactory.success({ sessionToken: token });
}


