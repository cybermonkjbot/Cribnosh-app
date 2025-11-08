import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /customer/account/password:
 *   put:
 *     summary: Change Customer Password
 *     description: Change the current customer's password by verifying current password and setting a new one
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Current password for verification
 *                 example: "currentPassword123"
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *                 example: "newSecurePassword456"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "Password changed successfully"
 *       400:
 *         description: Validation error (missing fields, password too short, etc.)
 *       401:
 *         description: Unauthorized - invalid current password or invalid/expired token
 *       403:
 *         description: Forbidden - only customers can change their password
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    // Parse request body
    const body = await request.json();
    const { current_password, new_password } = body;

    // Validation
    if (!current_password || !new_password) {
      return ResponseFactory.validationError('Current password and new password are required.');
    }

    if (new_password.length < 8) {
      return ResponseFactory.validationError('New password must be at least 8 characters long.');
    }

    const convex = getConvexClient();

    // Get user to verify current password
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }

    // Verify current password
    if (!user.password) {
      return ResponseFactory.unauthorized('No password set for this account. Please use password reset.');
    }

    try {
      // Check password (scrypt + salt)
      const [salt, storedHash] = user.password.split(':');
      if (!salt || !storedHash) {
        logger.error('[PASSWORD_CHANGE] Invalid password format for user:', user.email);
        return ResponseFactory.unauthorized('Invalid current password.');
      }
      const hash = scryptSync(current_password, salt, 64).toString('hex');
      if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
        return ResponseFactory.unauthorized('Invalid current password.');
      }
    } catch (error) {
      logger.error('[PASSWORD_CHANGE] Password verification error for user:', user.email, error);
      return ResponseFactory.unauthorized('Invalid current password.');
    }

    // Hash new password
    const newSalt = randomBytes(16).toString('hex');
    const newHash = scryptSync(new_password, newSalt, 64).toString('hex');
    const hashedPassword = `${newSalt}:${newHash}`;

    // Update password via Convex mutation
    await convex.mutation(api.mutations.users.updateUser, {
      userId: userId as Id<'users'>,
      password: hashedPassword,
    });

    return ResponseFactory.success({
      message: 'Password changed successfully',
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    logger.error('[PASSWORD_CHANGE] Error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to change password.'));
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));

