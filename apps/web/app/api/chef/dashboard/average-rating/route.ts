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
 *       - cookieAuth: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    const reviews = await convex.query(api.queries.reviews.getByChef, {
      chef_id: userId,
      sessionToken: sessionToken || undefined
    });
    const total_ratings = reviews.length;
    const average_rating = total_ratings > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / total_ratings : 0;
    return ResponseFactory.success({ average_rating, total_ratings });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 