import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /auth/token/refresh-jwt:
 *   post:
 *     summary: Refresh JWT Token
 *     description: Get a new JWT token with updated user roles from the database. This ensures the token reflects the current user roles, including automatic addition of 'customer' role if missing.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                     token:
 *                       type: string
 *                       description: New JWT token with updated roles
 *                     user:
 *                       type: object
 *                       description: Updated user information
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or expired token
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    const convex = getConvexClient();
    const userId = payload.user_id;
    
    // Get the latest user data from database
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }

    // Ensure user has 'customer' role for API access
    let userRoles = user.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      // Update user roles in database
      await convex.mutation(api.mutations.users.updateUserRoles, {
        userId: user._id,
        roles: userRoles,
      });
    }

    // Create new JWT token with updated roles
    const newToken = jwt.sign(
      { 
        user_id: user._id, 
        roles: userRoles,
        provider: payload.provider || 'unknown'
      }, 
      JWT_SECRET, 
      { expiresIn: '2h' }
    );

    const { password, sessionToken, sessionExpiry, ...safeUser } = user;

    return ResponseFactory.success({
      token: newToken,
      user: {
        ...safeUser,
        roles: userRoles,
      },
    });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to refresh token.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
