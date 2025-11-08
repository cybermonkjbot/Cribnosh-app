import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { randomBytes, scryptSync } from 'crypto';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /auth/register/chef:
 *   post:
 *     summary: Register Chef Account
 *     description: Create a new chef account with profile information and credentials
 *     tags: [Authentication, Chef]
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
 *               - bio
 *               - specialties
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 description: Chef's full name
 *                 example: "Maria Rodriguez"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Chef's email address
 *                 example: "maria.rodriguez@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Chef's password (minimum 6 characters)
 *                 example: "securePassword123"
 *               bio:
 *                 type: string
 *                 description: Chef's biography and background
 *                 example: "Passionate chef with 10 years of experience in Italian cuisine"
 *               specialties:
 *                 type: string
 *                 description: Chef's culinary specialties
 *                 example: "Italian, Mediterranean, Vegetarian"
 *               location:
 *                 type: string
 *                 description: Chef's location/city
 *                 example: "London, UK"
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Initial chef rating
 *                 example: 4.5
 *               image:
 *                 type: string
 *                 description: Chef's profile image URL
 *                 example: "https://example.com/chef-image.jpg"
 *     responses:
 *       200:
 *         description: Chef registered successfully
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
 *                     userId:
 *                       type: string
 *                       description: Created user ID
 *                       example: "j1234567890abcdef"
 *                     chefId:
 *                       type: string
 *                       description: Created chef profile ID
 *                       example: "j0987654321fedcba"
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
  const { name, email, password, bio, specialties, location, rating, image } = body;
  if (!name || !email || !password || !bio || !specialties || !location || password.length < 6) {
    return ResponseFactory.validationError('Missing or invalid required fields');
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
  let userId;
  try {
    userId = await convex.mutation(api.mutations.users.createUser, {
      name,
      email,
      password: passwordHash,
      roles: ['chef'],
      status: 'active',
    });
  } catch (err: any) {
    return ResponseFactory.badRequest(err.message || 'Failed to create user' );
  }
  let chefId;
  try {
    chefId = await convex.mutation(api.mutations.chefs.createChef, {
      userId,
      name,
      specialties,
      location,
      rating: rating || 0,
      image,
      bio,
      status: 'active',
    });
  } catch (err: any) {
    return ResponseFactory.badRequest(err.message || 'Failed to create chef profile' );
  }
  return ResponseFactory.success({ userId, chefId });
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 