import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
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
    
    // Check for JWT token in Authorization header (mobile apps)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = jwt.verify(token, JWT_SECRET) as any;
        userId = payload.user_id;
        // For JWT tokens, we just validate and allow logout
        // The mobile app will handle token deletion client-side
      } catch (error) {
        // Invalid JWT token, but we'll still return success to allow client-side cleanup
        console.log('[LOGOUT] Invalid JWT token, allowing client-side cleanup');
      }
    }
    
    // Check for session token in cookies (web apps)
    const cookieToken = request.cookies.get('convex-auth-token')?.value;
    if (cookieToken && !userId) {
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
  } catch (error: any) {
    // Even if there's an error, return success to allow client-side cleanup
    // Mobile apps rely on client-side token deletion
    const response = ResponseFactory.success({ message: 'Logged out successfully.' });
    const cookieToken = request.cookies.get('convex-auth-token')?.value;
    if (cookieToken) {
      response.cookies.set('convex-auth-token', '', { path: '/', maxAge: 0 });
    }
    return response;
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 