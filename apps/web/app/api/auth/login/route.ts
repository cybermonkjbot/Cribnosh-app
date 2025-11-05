import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { scryptSync, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

// Endpoint: /v1/auth/login
// Group: auth

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticate user with email and password, returns JWT token
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
    const user = await convex.query(api.queries.users.getUserByEmail, { email });
    if (!user) {
      return ResponseFactory.unauthorized('Invalid credentials.');
    }
    // Password check (scrypt + salt)
    try {
      const [salt, storedHash] = user.password.split(':');
      if (!salt || !storedHash) {
        console.error('[LOGIN] Invalid password format for user:', email);
        return ResponseFactory.unauthorized('Invalid credentials.');
      }
      const hash = scryptSync(password, salt, 64).toString('hex');
      if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
        return ResponseFactory.unauthorized('Invalid credentials.');
      }
    } catch (error) {
      console.error('[LOGIN] Password verification error for user:', email, error);
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
      });
    }
    
    // Check if user has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Create verification session for 2FA
      const verificationToken = await convex.mutation(api.mutations.verificationSessions.createVerificationSession, {
        userId: user._id,
      });
      
      // Return verification token instead of JWT
      return ResponseFactory.success({
        success: true,
        requires2FA: true,
        verificationToken,
        message: '2FA verification required',
      });
    }
    
    // No 2FA required - create JWT token
    const token = jwt.sign({ user_id: user._id, roles: userRoles }, JWT_SECRET, { expiresIn: '2h' });
    return ResponseFactory.success({ success: true, token, user: { user_id: user._id, email: user.email, name: user.name, roles: userRoles } });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Login failed.' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 