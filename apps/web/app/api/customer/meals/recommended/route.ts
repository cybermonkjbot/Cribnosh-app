import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/customer/meals/recommended:
 *   get:
 *     summary: Get Personalized Meal Recommendations
 *     description: Get personalized meal recommendations based on user preferences, likes, and follows
 *     tags: [Customer, Meals, Recommendations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Extract userId from request (required for recommendations)
    const userId = extractUserIdFromRequest(request);
    
    if (!userId) {
      return ResponseFactory.unauthorized('Authentication required for personalized recommendations');
    }

    const convex = getConvexClientFromRequest(request);
    
    // Get personalized recommendations
    const recommendations = await convex.query(api.queries.mealRecommendations.getRecommended, {
      userId: userId as any,
      limit,
    }) as unknown[];

    return ResponseFactory.success({ 
      recommendations,
      count: recommendations.length,
      limit,
    }, 'Recommendations retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Get recommendations error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve recommendations')
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

