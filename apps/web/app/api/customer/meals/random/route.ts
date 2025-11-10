import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/customer/meals/random:
 *   get:
 *     summary: Get Random Meals for Shake-to-Eat Feature
 *     description: Get a random selection of available meals, optionally filtered by user preferences. Used for the shake-to-eat feature.
 *     tags: [Customer, Meals, Random]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Number of random meals to return
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional user ID for preference-based filtering
 *     responses:
 *       200:
 *         description: Random meals retrieved successfully
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
 *                       description: Array of random meals with chef data
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Validate limit
    if (limit < 1 || limit > 50) {
      return ResponseFactory.validationError('Limit must be between 1 and 50');
    }

    // Extract userId from request (optional - for preference filtering)
    const userId = extractUserIdFromRequest(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get random meals
    const meals = await convex.query(
      (api as any).queries.meals.getRandomMeals,
      {
        userId: userId as any,
        limit,
      }
    ) as unknown[];

    return ResponseFactory.success({ 
      meals,
      count: meals.length,
      limit,
    }, 'Random meals retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Get random meals error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve random meals')
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

