import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /auth/token/get-jwt:
 *   get:
 *     summary: Get JWT Token from Session Token
 *     description: Convert a session token from cookies to a JWT token for API authentication
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: JWT token retrieved successfully
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
 *                       description: JWT token for API authentication
 *                     expires_in:
 *                       type: number
 *                       description: Token expiration time in seconds
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or expired session token
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('convex-auth-token')?.value;
    
    if (!sessionToken) {
      return ResponseFactory.unauthorized('Missing session token.');
    }

    const convex = getConvexClient();
    
    // Get user by session token
    const user = await convex.query(api.queries.users.getUserBySessionToken, { 
      sessionToken 
    });
    
    if (!user) {
      return ResponseFactory.unauthorized('Invalid or expired session token.');
    }

    // Check if session is expired
    if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
      return ResponseFactory.unauthorized('Session token has expired.');
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

    // Create JWT token
    const jwtToken = jwt.sign(
      { 
        user_id: user._id, 
        roles: userRoles,
        provider: 'session'
      }, 
      JWT_SECRET, 
      { expiresIn: '2h' }
    );

    return ResponseFactory.success({
      token: jwtToken,
      expires_in: 7200, // 2 hours in seconds
    });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get JWT token.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

