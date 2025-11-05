import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get All Users (Admin)
 *     description: Retrieve a paginated list of all users in the system (admin only)
 *     tags: [Admin, User Management]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users to return per page
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of users to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       description: Array of user objects
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           email:
 *                             type: string
 *                             example: "user@example.com"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           roles:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["customer"]
 *                           status:
 *                             type: string
 *                             example: "active"
 *                           _creationTime:
 *                             type: number
 *                             example: 1640995200000
 *                     total:
 *                       type: number
 *                       description: Total number of users
 *                       example: 1250
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       example: 0
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Bulk Delete Users (Admin)
 *     description: Delete multiple users by their IDs (admin only)
 *     tags: [Admin, User Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to delete
 *                 example: ["j1234567890abcdef", "j0987654321fedcba"]
 *     responses:
 *       200:
 *         description: Users deleted successfully
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
 *                     deleted:
 *                       type: number
 *                       description: Number of users deleted
 *                       example: 2
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing or invalid user_ids
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
 *         description: Forbidden - only admins can bulk delete users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error - user_ids array is required
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
interface JWTPayload {
  role?: string;
  roles?: string[];
  userId?: string;
  user_id?: string;
  email?: string;
  [key: string]: unknown;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === 'object' && verified !== null) {
        payload = verified as JWTPayload;
      } else {
        return ResponseFactory.unauthorized('Invalid token format.');
      }
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Fetch all users
    const allUsers = await convex.query(api.queries.users.getAllUsers, {});
    // Consistent ordering (createdAt DESC)
    allUsers.sort((a, b) => ((b._creationTime ?? 0) - (a._creationTime ?? 0)));
    const paginated = allUsers.slice(offset, offset + limit);
    return ResponseFactory.success({ users: paginated, total: allUsers.length, limit, offset });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleBulkDelete(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === 'object' && verified !== null) {
        payload = verified as JWTPayload;
      } else {
        return ResponseFactory.unauthorized('Invalid token format.');
      }
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can bulk delete users.');
    }
    const { user_ids } = await request.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return ResponseFactory.error('user_ids array is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    for (const userId of user_ids) {
      await convex.mutation(api.mutations.users.deleteUser, { userId });
    }
    // Audit log
    const adminId = payload.user_id ?? payload.userId;
    if (adminId && typeof adminId === 'string') {
      await convex.mutation(api.mutations.admin.insertAdminLog, {
        action: 'bulk_delete_users',
        details: { user_ids },
        adminId: adminId as unknown as Id<"users">,
      });
    }
    return ResponseFactory.success({ success: true, deleted: user_ids.length });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk delete users.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleSearch(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === 'object' && verified !== null) {
        payload = verified as JWTPayload;
      } else {
        return ResponseFactory.unauthorized('Invalid token format.');
      }
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can search users.');
    }
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase();
    const convex = getConvexClient();
    const allUsers = await convex.query(api.queries.users.getAllUsers, {});
    const results = allUsers.filter((u) =>
      (typeof u.name === 'string' && u.name.toLowerCase().includes(q)) ||
      (typeof u.email === 'string' && u.email.toLowerCase().includes(q)) ||
      (Array.isArray(u.roles) && u.roles.some(role => typeof role === 'string' && role.toLowerCase().includes(q)))
    );
    return ResponseFactory.success({ results });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to search users.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const BULK_DELETE = withAPIMiddleware(withErrorHandling(handleBulkDelete));
export const SEARCH = withAPIMiddleware(withErrorHandling(handleSearch)); 