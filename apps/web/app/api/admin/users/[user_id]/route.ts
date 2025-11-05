// Implements GET, PUT, PATCH, DELETE for /admin/users/{user_id}
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/users/{user_id}:
 *   get:
 *     summary: Get User by ID (Admin)
 *     description: Retrieve detailed information about a specific user by their ID. Only accessible by administrators.
 *     tags: [Admin, User Management]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john@example.com"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["customer"]
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         _creationTime:
 *                           type: number
 *                           example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     summary: Update User (Admin)
 *     description: Partially update user information. Only accessible by administrators. Changes are logged for audit purposes.
 *     tags: [Admin, User Management]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.smith@example.com"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [customer, chef, admin, staff]
 *                 description: User roles
 *                 example: ["customer"]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: User account status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can update users
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
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Replace User Data (Admin)
 *     description: Completely replace user information. Only accessible by administrators. Protected fields are automatically excluded.
 *     tags: [Admin, User Management]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.smith@example.com"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [customer, chef, admin, staff]
 *                 description: User roles
 *                 example: ["customer"]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: User account status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: User replaced successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can replace users
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
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete User (Admin)
 *     description: Permanently delete a user account. Only accessible by administrators. This action is logged for audit purposes.
 *     tags: [Admin, User Management]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user to delete
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can delete users
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
 *     security:
 *       - bearerAuth: []
 */

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function extractUserIdFromUrl(request: NextRequest): Id<'users'> | undefined {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/users\/([^/]+)/);
  return match ? (match[1] as Id<'users'>) : undefined;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const user_id = extractUserIdFromUrl(request);
    if (!user_id) {
      return ResponseFactory.validationError('Missing user_id');
    }
    const convex = getConvexClient();
    const user = await convex.query(api.queries.users.getById, { userId: user_id });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }
    const { password, sessionToken, sessionExpiry, ...safeUser } = user;
    return ResponseFactory.success({ user: safeUser });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch user.' );
  }
}

async function handlePATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can update users.');
    }
    const user_id = extractUserIdFromUrl(request);
    if (!user_id) {
      return ResponseFactory.validationError('Missing user_id');
    }
    const updates = await request.json();
    const convex = getConvexClient();
    await convex.mutation(api.mutations.users.updateUser, {
      userId: user_id,
      ...updates,
    });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'update_user',
      details: { user_id, updates },
      adminId: payload.user_id as Id<'users'>,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to update user.' );
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can delete users.');
    }
    const user_id = extractUserIdFromUrl(request);
    if (!user_id) {
      return ResponseFactory.validationError('Missing user_id');
    }
    const convex = getConvexClient();
    await convex.mutation(api.mutations.users.deleteUser, { userId: user_id });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'delete_user',
      details: { user_id },
      adminId: payload.user_id as Id<'users'>,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to delete user.' );
  }
}

async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can update users.');
    }
    const user_id = extractUserIdFromUrl(request);
    if (!user_id) {
      return ResponseFactory.validationError('Missing user_id');
    }
    const newUserData = await request.json();
    // Remove protected fields
    delete newUserData._id;
    delete newUserData.password;
    delete newUserData.sessionToken;
    delete newUserData.sessionExpiry;
    const convex = getConvexClient();
    await convex.mutation(api.mutations.users.updateUser, {
      userId: user_id,
      ...newUserData,
    });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'replace_user',
      details: { user_id, newUserData },
      adminId: payload.user_id as Id<'users'>,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to replace user.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
