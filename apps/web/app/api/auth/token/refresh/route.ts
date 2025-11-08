import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /auth/token/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     description: Generate a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     access_token:
 *                       type: string
 *                       description: New access token
 *                       example: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7"
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       description: Token expiration timestamp
 *                       example: "2024-01-22T10:30:00.000Z"
 *                     token_type:
 *                       type: string
 *                       description: Token type
 *                       example: "bearer"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or expired refresh token
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
 *     security: []
 */

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { refresh_token } = body;
    if (!refresh_token) {
      return ResponseFactory.validationError('Missing refresh_token');
    }
    const convex = getConvexClient();
    const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken: refresh_token });
    if (!user) {
      return ResponseFactory.unauthorized('Invalid or expired refresh token');
    }
    // Generate new session token and expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    await convex.mutation(api.mutations.users.setSessionToken, { userId: user._id, sessionToken: newToken, sessionExpiry: newExpiry });
    return ResponseFactory.success({
      access_token: newToken,
      expires_at: new Date(newExpiry).toISOString(),
      token_type: 'bearer',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to refresh token.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 