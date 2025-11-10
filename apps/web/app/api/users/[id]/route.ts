import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get User by ID
 *     description: Retrieve user information by ID. Users can access their own data, and drivers can access customer data for their orders.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                         fullName:
 *                           type: string
 *                           example: "John Doe"
 *                         phone:
 *                           type: string
 *                           example: "+1234567890"
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
 *       403:
 *         description: Forbidden - user not authorized to access this data
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedUser(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    const targetUserId = params.id as Id<'users'>;

    // Get user by ID using Convex query
    const user = await convex.query(api.queries.users.getUserById, {
      userId: targetUserId,
      sessionToken: sessionToken || undefined,
    });

    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }

    // Exclude sensitive fields
    const { password, sessionToken: userSessionToken, sessionExpiry, ...safeUser } = user;

    return ResponseFactory.success({ user: safeUser });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch user.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

