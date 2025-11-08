import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     summary: Admin Logout
 *     description: Log out admin users by clearing their session cookies. This endpoint invalidates the admin session and removes authentication cookies.
 *     tags: [Admin, Authentication]
 *     responses:
 *       200:
 *         description: Admin logged out successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *         headers:
 *           Set-Cookie:
 *             description: Cleared Convex session token cookie
 *             schema:
 *               type: string
 *               example: "convex-auth-token=; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

export async function POST() {
  try {
    // Create response with success
    const response = ResponseFactory.success({ success: true });
    
    // Clear the Convex session token cookie
    response.cookies.set('convex-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // Expire immediately
      path: '/',
    });
    
    return response;
  } catch (e) {
    console.error('[ADMIN LOGOUT] Internal Server Error:', e);
    return ResponseFactory.internalError('Logout failed');
  }
} 