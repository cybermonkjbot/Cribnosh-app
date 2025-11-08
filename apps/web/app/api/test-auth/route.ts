import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
/**
 * @swagger
 * /test-auth:
 *   get:
 *     summary: Test Authentication Token
 *     description: Validates a JWT token and returns decoded payload information for testing purposes. This endpoint helps verify token structure, roles, and authentication status.
 *     tags: [Authentication]
 *     parameters:
 *       - in: header
 *         name: authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication
 *         example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token validation successful
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     payload:
 *                       type: object
 *                       description: Decoded JWT payload
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["user", "chef"]
 *                         iat:
 *                           type: number
 *                           example: 1640995200
 *                         exp:
 *                           type: number
 *                           example: 1641081600
 *                     hasRoles:
 *                       type: boolean
 *                       description: Whether the token contains roles
 *                       example: true
 *                     rolesType:
 *                       type: string
 *                       description: Type of roles field
 *                       example: "object"
 *                     rolesLength:
 *                       type: string
 *                       description: Length of roles array or type description
 *                       example: "2"
 *                     hasChefRole:
 *                       type: boolean
 *                       description: Whether user has chef role
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - missing, invalid, or expired token
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
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    
    return ResponseFactory.success({ 
      success: true, 
      payload: {
        user_id: userId,
        email: user.email,
        roles: user.roles,
      },
      hasRoles: !!user.roles,
      rolesType: typeof user.roles,
      rolesLength: Array.isArray(user.roles) ? user.roles.length : 'not an array',
      hasChefRole: Array.isArray(user.roles) ? user.roles.includes('chef') : false
    });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = handleGET; 