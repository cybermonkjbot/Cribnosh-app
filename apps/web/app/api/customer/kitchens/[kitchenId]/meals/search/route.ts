import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/meals/search:
 *   get:
 *     summary: Search meals within a kitchen
 *     description: Search for meals within a specific kitchen/chef with optional filters
 *     tags: [Customer, Kitchens, Meals, Search]
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
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by meal category/cuisine
 *       - in: query
 *         name: dietary
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by dietary requirements
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Missing search query
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

    const query = searchParams.get('q') || '';
    if (!query) {
      return ResponseFactory.validationError('Search query (q) is required');
    }

    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const dietary = searchParams.getAll('dietary');

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

    // Search meals by chef with user preferences
    const meals = await convex.query(
      (api as any).queries.meals.searchMealsByChefId,
      {
        chefId,
        query,
        userId,
        category,
        dietary: dietary.length > 0 ? dietary : undefined,
        limit,
      }
    );

    return ResponseFactory.success({ meals, query }, 'Search results retrieved successfully');

  } catch (error: unknown) {
    console.error('Search meals error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to search meals')
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

