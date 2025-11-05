/**
 * @swagger
 * components:
 *   schemas:
 *     PendingDish:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the dish
 *         name:
 *           type: string
 *           description: Name of the dish
 *         description:
 *           type: string
 *           description: Description of the dish
 *         chefId:
 *           type: string
 *           description: ID of the chef who created the dish
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Approval status of the dish
 *         createdAt:
 *           type: number
 *           description: Creation timestamp
 */

import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /api/admin/dishes/pending:
 *   get:
 *     summary: Get pending dishes
 *     description: Retrieve all dishes awaiting admin approval
 *     tags: [Admin - Dishes]
 *     responses:
 *       200:
 *         description: Pending dishes retrieved successfully
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
 *                     meals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PendingDish'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    interface JWTPayload {
      role?: string;
      roles?: string[];
      userId?: string;
      user_id?: string;
      email?: string;
      [key: string]: unknown;
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    const pendingMeals = await convex.query(api.queries.meals.getPending, {});
    return ResponseFactory.success({ meals: pendingMeals });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pending dishes.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 