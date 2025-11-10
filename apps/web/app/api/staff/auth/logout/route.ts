import { api } from '@/convex/_generated/api';
import { getUserFromCookies } from '@/lib/auth/session';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { cookies } from 'next/headers';
import { withErrorHandling } from '@/lib/errors';
import { NextResponse, NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';

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
async function handlePOST(request: NextRequest) {
  try {
    // Clear Convex Auth token cookie
    const cookieStore = await cookies();
    const user = await getUserFromCookies(cookieStore);
    const isProd = process.env.NODE_ENV === 'production';
    if (user) {
      const convex = getConvexClientFromRequest(request);
      const sessionToken = getSessionTokenFromRequest(request);
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
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Logout failed'));
  }
} 

export const POST = withErrorHandling(handlePOST);