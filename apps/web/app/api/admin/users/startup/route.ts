import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';

/**
 * @swagger
 * /admin/users/startup:
 *   get:
 *     summary: Get Recent Users for Startup Dashboard (Admin)
 *     description: Retrieve a list of recently registered users for the admin startup dashboard. Provides quick access to new user activity and onboarding metrics.
 *     tags: [Admin, User Management]
 *     responses:
 *       200:
 *         description: Recent users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of recent user objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: User ID
 *                         example: "j1234567890abcdef"
 *                       name:
 *                         type: string
 *                         description: User's full name
 *                         example: "John Doe"
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: User's email address
 *                         example: "john@example.com"
 *                       roles:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: User roles
 *                         example: ["customer"]
 *                       status:
 *                         type: string
 *                         description: Account status
 *                         example: "active"
 *                       _creationTime:
 *                         type: number
 *                         description: Account creation timestamp
 *                         example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can access this endpoint
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
 *       - cookieAuth: []
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const convex = getConvexClientFromRequest(request);
    const users = await convex.query(api.queries.users.getRecentUsers, { limit: 20 });
    return ResponseFactory.success(users);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 