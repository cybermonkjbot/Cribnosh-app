import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { randomBytes, scryptSync } from 'crypto';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /auth/register/customer:
 *   post:
 *     summary: Register Customer Account
 *     description: Create a new customer account with user credentials
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
 *                 description: Customer's full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer's email address
 *                 example: "john.doe@example.com"
 *               phone_number:
 *                 type: string
 *                 description: Customer's phone number
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Customer's password (minimum 6 characters)
 *                 example: "securePassword123"
 *               role:
 *                 type: string
 *                 enum: [customer]
 *                 description: User role (must be 'customer')
 *                 example: "customer"
 *     responses:
 *       200:
 *         description: Customer registered successfully
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
 *                           description: User ID
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["user"]
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         _creationTime:
 *                           type: number
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
  const { name, email, phone_number, password, role } = body;
  if (!name || !email || !password || password.length < 6) {
    return ResponseFactory.validationError('Missing or invalid required fields');
  }
  if (role && role !== 'customer') {
    return ResponseFactory.validationError('Role must be customer');
  }
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  // Duplicate email check
  const existing = await convex.query(api.queries.users.getUserByEmail, {
    email,
    sessionToken: sessionToken || undefined
  });
  if (existing) {
    return ResponseFactory.error('A user with this email already exists.', 'CUSTOM_ERROR', 409);
  }
  // Hash password (scrypt + salt)
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const passwordHash = `${salt}:${hash}`;
  try {
    const userId = await convex.mutation(api.mutations.users.create, {
      name,
      email,
      password: passwordHash,
      roles: ['user'],
      status: 'active',
      sessionToken: sessionToken || undefined
    });
    const user = await convex.query(api.queries.users.getById, {
      userId,
      sessionToken: sessionToken || undefined
    });
    if (!user) {
      return ResponseFactory.internalError('User creation failed.');
    }
    // Commenting out non-existent function
    // let customerProfile = null;
    // try {
    //   customerProfile = await convex.mutation(api.mutations.customers_createCustomerProfile, {
    //     userId,
    //     email,
    //     phone_number: phone_number || null,
    //   });
    // } catch (err: any) {}
    const now = new Date().toISOString();
    return ResponseFactory.success({ success: true, user: { ...user, roles: user.roles } });
  } catch (err: any) {
    return ResponseFactory.badRequest(err.message || 'Failed to create user' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 