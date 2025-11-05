import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/meals:
 *   get:
 *     summary: Get meals for a kitchen
 *     description: Get all meals available from a specific kitchen/chef with optional filters
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
 *         description: Number of meals to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of meals to skip
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
 *         description: Filter by dietary requirements (e.g., vegetarian, vegan, gluten-free)
 *     responses:
 *       200:
 *         description: Meals retrieved successfully
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
    const offset = parseInt(searchParams.get('offset') || '0');
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

    // Get meals by chef with filters and user preferences
    const meals = await convex.query(
      (api as any).queries.meals.getByChefId,
      {
        chefId,
        userId,
        limit,
        offset,
        category,
        dietary: dietary.length > 0 ? dietary : undefined,
      }
    );

    return ResponseFactory.success({ meals }, 'Meals retrieved successfully');

  } catch (error: any) {
    console.error('Get meals error:', error);
    return ResponseFactory.internalError(
      error.message || 'Failed to retrieve meals'
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

