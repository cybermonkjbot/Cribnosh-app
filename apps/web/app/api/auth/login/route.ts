import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { scryptSync, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

// Endpoint: /v1/auth/login
// Group: auth

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticate user with email and password, returns session token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           description: User ID
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["customer"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
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
 *     security: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return ResponseFactory.validationError('Email and password are required.');
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    const user = await convex.query(api.queries.users.getUserByEmail, {
      email,
      sessionToken: sessionToken || undefined
    });
    if (!user) {
      return ResponseFactory.unauthorized('Invalid credentials.');
    }
    // Password check (scrypt + salt)
    try {
      const [salt, storedHash] = user.password.split(':');
      if (!salt || !storedHash) {
        logger.error('[LOGIN] Invalid password format for user:', email);
        return ResponseFactory.unauthorized('Invalid credentials.');
      }
      const hash = scryptSync(password, salt, 64).toString('hex');
      if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
        return ResponseFactory.unauthorized('Invalid credentials.');
      }
    } catch (error) {
      logger.error('[LOGIN] Password verification error for user:', email, error);
      return ResponseFactory.unauthorized('Invalid credentials.');
    }
    
    // Ensure user has 'customer' role for API access
    let userRoles = user.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      // Update user roles in database
      await convex.mutation(api.mutations.users.updateUserRoles, {
        userId: user._id,
        roles: userRoles,
        sessionToken: sessionToken || undefined
      });
    }
    
    // Check if user has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Create verification session for 2FA
      const verificationToken = await convex.mutation(api.mutations.verificationSessions.createVerificationSession, {
        userId: user._id,
        sessionToken: sessionToken || undefined
      });
      
      // Return verification token instead of JWT
      return ResponseFactory.success({
        success: true,
        requires2FA: true,
        verificationToken,
        message: '2FA verification required',
      });
    }
    
    // No 2FA required - create session token using Convex mutation
    const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
      userId: user._id,
      expiresInDays: 30, // 30 days expiry,
      sessionToken: sessionToken || undefined
    });
    
    // Set session token cookie
    const isProd = process.env.NODE_ENV === 'production';
    const response = ResponseFactory.success({ 
      success: true, 
      sessionToken: sessionResult.sessionToken,
      user: { 
        user_id: user._id, 
        email: user.email, 
        name: user.name, 
        roles: userRoles 
      } 
    });
    
    response.cookies.set('convex-auth-token', sessionResult.sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Login failed.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 