import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { randomBytes, scryptSync } from 'crypto';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /auth/register/admin:
 *   post:
 *     summary: Register Admin Account
 *     description: Create a new administrator account with elevated privileges. This endpoint creates a user with admin role and full system access permissions.
 *     tags: [Authentication, Admin]
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
 *                 description: Administrator's full name
 *                 example: "Admin User"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Administrator's email address
 *                 example: "admin@cribnosh.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Administrator's password (minimum 6 characters)
 *                 example: "adminPassword123"
 *     responses:
 *       200:
 *         description: Admin registered successfully
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Admin user ID
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           example: "Admin User"
 *                         email:
 *                           type: string
 *                           example: "admin@cribnosh.com"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["admin"]
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         _creationTime:
 *                           type: number
 *                           description: Account creation timestamp
 *                           example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid JSON or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - user with email already exists
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
  let body: any;
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON body');
  }
  const { name, email, password } = body;
  if (!name || !email || !password || password.length < 6) {
    return ResponseFactory.validationError('Missing or invalid fields');
  }
  const convex = getConvexClient();
  // Duplicate email check
  const existing = await convex.query(api.queries.users.getUserByEmail, { email });
  if (existing) {
    return ResponseFactory.error('A user with this email already exists.', 'CUSTOM_ERROR', 409);
  }
  // Hash password (scrypt + salt)
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const passwordHash = `${salt}:${hash}`;
  try {
    const userId = await convex.mutation(api.mutations.users.createUser, { name, email, password: passwordHash, roles: ['admin'], status: 'active' });
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return ResponseFactory.internalError('Failed to create user');
    }
    return ResponseFactory.success({ success: true, user: { ...user, roles: user.roles } });
  } catch (e: any) {
    return ResponseFactory.internalError(e.message || 'Failed to register admin' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 