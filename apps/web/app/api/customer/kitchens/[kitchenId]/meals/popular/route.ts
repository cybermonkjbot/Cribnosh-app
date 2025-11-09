import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/meals/popular:
 *   get:
 *     summary: Get popular meals for a kitchen
 *     description: Get the most popular meals from a specific kitchen/chef sorted by rating and review count
 *     tags: [Customer, Kitchens, Meals]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: kitchenId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the kitchen
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of popular meals to return
 *     responses:
 *       200:
 *         description: Popular meals retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Kitchen not found
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { kitchenId: string } }
): Promise<NextResponse> {
  try {
    const { kitchenId } = params;
    const { searchParams } = new URL(request.url);
    
    if (!kitchenId) {
      return ResponseFactory.validationError('Kitchen ID is required');
    }

    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '10');

    // Extract userId from request (optional for public endpoints)
    const userId = extractUserIdFromRequest(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get chef ID from kitchen
    const chefId = await convex.query(
      api.queries.kitchens.getChefByKitchenId as any,
      {
      kitchenId,
      sessionToken: sessionToken || undefined
    }
    ) as string | undefined;

    if (!chefId) {
      return ResponseFactory.notFound('Chef not found for this kitchen');
    }

    // Get popular meals by chef with user preferences
    const meals = await convex.query(
      api.queries.meals.getPopularByChefId as any,
      {
        chefId,
        userId: userId as any,
        limit,
        sessionToken: sessionToken || undefined
      }
    ) as unknown[];

    return ResponseFactory.success({ meals }, 'Popular meals retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Get popular meals error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve popular meals')
    );
  }
}

// Wrapper function to extract params from URL
export const GET = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const kitchenIdIndex = pathParts.indexOf('kitchens') + 1;
    const kitchenId = pathParts[kitchenIdIndex];
    return handleGET(request, { params: { kitchenId } });
  })
);

