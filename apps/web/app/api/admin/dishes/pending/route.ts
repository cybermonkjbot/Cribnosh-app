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
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

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
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const convex = getConvexClient();
    const pendingMeals = await convex.query(api.queries.meals.getPending, {});
    return ResponseFactory.success({ meals: pendingMeals });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pending dishes.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 