import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

// Endpoint: /v1/auth/me
// Group: auth

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get Current User
 *     description: Get the current authenticated user's profile information
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       type: object
 *                       description: User profile (excluding sensitive fields)
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: User ID
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["customer"]
 *                         _creationTime:
 *                           type: number
 *                           description: Account creation timestamp
 *                           example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.cookies.get('sessionToken')?.value;
    let userId: string | undefined;
    let payload: any;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        payload = jwt.verify(token, JWT_SECRET);
        userId = payload.user_id;
      } catch {
        return ResponseFactory.unauthorized('Invalid or expired token.');
      }
    } else if (sessionToken) {
      // Validate sessionToken (assume it's the user's sessionToken field)
      const convex = getConvexClient();
      const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken });
      if (!user) {
        return ResponseFactory.unauthorized('Invalid or expired session.');
      }
      userId = user._id;
    } else {
      return ResponseFactory.unauthorized('Missing authentication.');
    }
    if (!userId) {
      return ResponseFactory.unauthorized('Invalid authentication: missing user_id.');
    }
    const convex = getConvexClient();
    const user = await convex.query(api.queries.users.getById, { userId: userId as Id<"users"> });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }
    const { password, sessionToken: st, sessionExpiry, ...safeUser } = user;
    return ResponseFactory.success({ user: safeUser });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch user.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 