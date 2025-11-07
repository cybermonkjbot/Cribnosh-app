import { api } from '@/convex/_generated/api';
import { getUserFromCookies } from '@/lib/auth/session';
import { getConvexClient } from '@/lib/conxed-client';
import { cookies } from 'next/headers';
import { withErrorHandling } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

/**
 * @swagger
 * /staff/auth/logout:
 *   post:
 *     summary: Staff Logout
 *     description: Logout staff user and clear session token
 *     tags: [Staff, Authentication]
 *     responses:
 *       200:
 *         description: Staff logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST() {
  try {
    // Clear Convex Auth token cookie
    const cookieStore = await cookies();
    const user = await getUserFromCookies(cookieStore);
    const isProd = process.env.NODE_ENV === 'production';
    if (user) {
      const convex = getConvexClient();
      await convex.mutation(api.mutations.users.setSessionToken, { userId: user._id, sessionToken: '', sessionExpiry: 0 });
    }
    const response = ResponseFactory.success({ success: true });
    response.cookies.set('convex-auth-token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'strict',
      secure: isProd
    });
    return response;
  } catch (e) {
    return ResponseFactory.internalError('Logout failed' );
  }
} 

export const POST = withErrorHandling(handlePOST);