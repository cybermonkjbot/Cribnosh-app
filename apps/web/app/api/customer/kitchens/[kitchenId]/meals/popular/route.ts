import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/meals/popular:
 *   get:
 *     summary: Get popular meals for a kitchen
 *     description: Get the most popular meals from a specific kitchen/chef sorted by rating and review count
 *     tags: [Customer, Kitchens, Meals]
 *     security:
 *       - Bearer: []
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

    const convex = getConvexClient();
    
    // Get chef ID from kitchen
    const chefId = await convex.query(
      (api as any).queries.kitchens.getChefByKitchenId,
      { kitchenId }
    );

    if (!chefId) {
      return ResponseFactory.notFound('Chef not found for this kitchen');
    }

    // Get popular meals by chef with user preferences
    const meals = await convex.query(
      (api as any).queries.meals.getPopularByChefId,
      {
        chefId,
        userId,
        limit,
      }
    );

    return ResponseFactory.success({ meals }, 'Popular meals retrieved successfully');

  } catch (error: any) {
    console.error('Get popular meals error:', error);
    return ResponseFactory.internalError(
      error.message || 'Failed to retrieve popular meals'
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

