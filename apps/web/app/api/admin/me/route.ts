import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /admin/me:
 *   get:
 *     summary: Get Admin Profile
 *     description: Retrieve the current authenticated admin user's profile information
 *     tags: [Admin, Authentication]
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
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
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Admin user ID
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "admin@cribnosh.com"
 *                         name:
 *                           type: string
 *                           example: "Admin User"
 *                         role:
 *                           type: string
 *                           description: Primary role
 *                           example: "admin"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: All user roles
 *                           example: ["admin"]
 *                         status:
 *                           type: string
 *                           description: User account status
 *                           example: "active"
 *                 message:
 *                   type: string
 *                   example: "Admin user data retrieved successfully"
 *       401:
 *         description: Unauthorized - no session token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not an admin
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
export async function GET(request: NextRequest) {
  try {
    // Get authenticated admin user from session token
    const { user } = await getAuthenticatedAdmin(request);

    // Return user data
    return ResponseFactory.success({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.roles?.includes('admin') ? 'admin' : user.roles?.[0] || 'admin',
        roles: user.roles,
        status: user.status
      }
    }, 'Admin user data retrieved successfully');
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to retrieve admin user data'));
  }
}
