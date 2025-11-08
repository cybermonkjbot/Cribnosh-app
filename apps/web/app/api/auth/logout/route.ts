import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
// Endpoint: /v1/auth/logout
// Group: auth

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User Logout
 *     description: Logout user by invalidating session token (cookies) or clearing JWT token. Works for both web (cookies) and mobile (JWT) clients.
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                       example: "Logged out successfully."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *         headers:
 *           Set-Cookie:
 *             description: Cleared authentication cookie (web only)
 *             schema:
 *               type: string
 *               example: "convex-auth-token=; Path=/; Max-Age=0"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const convex = getConvexClient();
    let userId: string | null = null;
    
    // Check for session token in cookies (web apps)
    const cookieToken = request.cookies.get('convex-auth-token')?.value;
    if (cookieToken) {
      const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken: cookieToken });
      if (user) {
        userId = user._id;
        // Invalidate session token for web
        await convex.mutation(api.mutations.users.setSessionToken, { 
          userId: user._id, 
          sessionToken: '', 
          sessionExpiry: 0 
        });
      }
    }
    
    // Create response - always return success to allow client-side cleanup
    // Mobile apps rely on client-side token deletion (SecureStore)
    const response = ResponseFactory.success({ message: 'Logged out successfully.' });
    
    // Clear cookie if it exists (web)
    if (cookieToken) {
      response.cookies.set('convex-auth-token', '', { path: '/', maxAge: 0 });
    }
    
    return response;
  } catch (error: unknown) {
    // Even if there's an error, return success to allow client-side cleanup
    // Mobile apps rely on client-side token deletion
    logger.error('[LOGOUT] Error:', getErrorMessage(error, 'Logout error'));
    const response = ResponseFactory.success({ message: 'Logged out successfully.' });
    const cookieToken = request.cookies.get('convex-auth-token')?.value;
    if (cookieToken) {
      response.cookies.set('convex-auth-token', '', { path: '/', maxAge: 0 });
    }
    return response;
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 