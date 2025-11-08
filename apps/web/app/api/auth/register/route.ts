import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { randomBytes, scryptSync } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';

// Endpoint: /v1/auth/register
// Group: auth

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User Registration
 *     description: Register a new user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password (minimum 8 characters)
 *                 example: "securePassword123"
 *               role:
 *                 type: string
 *                 description: User role (defaults to 'customer')
 *                 enum: [customer, chef, admin]
 *                 example: "customer"
 *     responses:
 *       200:
 *         description: Registration successful
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
 *                     userId:
 *                       type: string
 *                       description: Created user ID
 *                       example: "j1234567890abcdef"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["customer"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
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
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || password.length < 8) {
      return ResponseFactory.validationError('Name, email, and password are required.');
    }
    if (!validateEmail(email)) {
      return ResponseFactory.validationError('Invalid email format.');
    }
    const convex = getConvexClient();
    // Check for existing user
    const existing = await convex.query(api.queries.users.getUserByEmail, { email });
    if (existing) {
      return ResponseFactory.error('A user with this email already exists.', 'CUSTOM_ERROR', 409);
    }
    // Hash password (scrypt + salt)
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    const passwordHash = `${salt}:${hash}`;
    // Create user in Convex
    const userId = await convex.mutation(api.mutations.users.create, {
      name,
      email,
      password: passwordHash,
      roles: [role || 'customer'],
      status: 'active',
    });
    return ResponseFactory.success({ success: true, userId, email, name, roles: [role || 'customer'] });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 