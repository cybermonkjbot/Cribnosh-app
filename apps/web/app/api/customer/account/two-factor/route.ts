import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { scryptSync, timingSafeEqual } from 'crypto';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /customer/account/two-factor:
 *   delete:
 *     summary: Disable Two-Factor Authentication
 *     description: Disable 2FA for the current customer. Optionally requires password verification.
 *     tags: [Customer, Security]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Optional password verification for security
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       401:
 *         description: Unauthorized or invalid password
 *       403:
 *         description: Forbidden
 */
async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const body = await request.json().catch(() => ({}));
    const { password } = body;
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get user to verify password if provided
    const user = await convex.query(api.queries.users.getById, {
      userId,
      sessionToken: sessionToken || undefined
    });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }
    
    // If password is provided, verify it
    if (password) {
      const [salt, hashedPassword] = user.password.split(':');
      const hashToVerify = scryptSync(password, salt, 64);
      const storedHash = Buffer.from(hashedPassword, 'hex');
      
      if (!timingSafeEqual(hashToVerify, storedHash)) {
        return ResponseFactory.unauthorized('Invalid password.');
      }
    }
    
    // Disable 2FA
    await convex.mutation(api.mutations.users.disableTwoFactor, {
      userId: userId as any,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({
      message: '2FA disabled successfully',
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to disable 2FA.'));
  }
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

