import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { scryptSync, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access this endpoint.');
    }
    
    const body = await request.json().catch(() => ({}));
    const { password } = body;
    
    const convex = getConvexClient();
    const userId = payload.user_id;
    
    // Get user to verify password if provided
    const user = await convex.query(api.queries.users.getById, { userId });
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
    });
    
    return ResponseFactory.success({
      message: '2FA disabled successfully',
    });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to disable 2FA.'));
  }
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

