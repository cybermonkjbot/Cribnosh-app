/**
 * @swagger
 * /api/chef/dashboard/average-rating:
 *   get:
 *     summary: Get chef average rating
 *     description: Retrieve the average rating and total number of ratings for the authenticated chef
 *     tags: [Chef - Dashboard]
 *     responses:
 *       200:
 *         description: Average rating retrieved successfully
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
 *                     average_rating:
 *                       type: number
 *                       description: Average rating score
 *                       example: 4.5
 *                     total_ratings:
 *                       type: number
 *                       description: Total number of ratings
 *                       example: 42
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Chef access required
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
    if (payload.role !== 'chef') {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access average rating.');
    }
    const convex = getConvexClient();
    const reviews = await convex.query(api.queries.reviews.getByChef, { chef_id: payload.user_id });
    const total_ratings = reviews.length;
    const average_rating = total_ratings > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / total_ratings : 0;
    return ResponseFactory.success({ average_rating, total_ratings });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch average rating.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 