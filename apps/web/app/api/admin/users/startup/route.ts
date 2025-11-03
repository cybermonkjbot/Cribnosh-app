import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/users/startup:
 *   get:
 *     summary: Get Recent Users for Startup Dashboard (Admin)
 *     description: Retrieve a list of recently registered users for the admin startup dashboard. Provides quick access to new user activity and onboarding metrics.
 *     tags: [Admin, User Management]
 *     responses:
 *       200:
 *         description: Recent users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of recent user objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: User ID
 *                         example: "j1234567890abcdef"
 *                       name:
 *                         type: string
 *                         description: User's full name
 *                         example: "John Doe"
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: User's email address
 *                         example: "john@example.com"
 *                       roles:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: User roles
 *                         example: ["customer"]
 *                       status:
 *                         type: string
 *                         description: Account status
 *                         example: "active"
 *                       _creationTime:
 *                         type: number
 *                         description: Account creation timestamp
 *                         example: 1640995200000
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
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
  }
  const token = authHeader.replace('Bearer ', '');
  let payload: any;
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return ResponseFactory.unauthorized('Invalid or expired token.');
  }
  if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
    return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
  }
  const convex = getConvexClient();
  const users = await convex.query(api.queries.users.getRecentUsers, { limit: 20 });
  return ResponseFactory.success(users);
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 