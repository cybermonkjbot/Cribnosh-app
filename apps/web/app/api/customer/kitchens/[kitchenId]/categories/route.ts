import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/categories:
 *   get:
 *     summary: Get meal categories for a kitchen
 *     description: Get all available meal categories with meal counts for a specific kitchen/chef
 *     tags: [Customer, Kitchens, Meals, Categories]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: kitchenId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the kitchen
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: "Italian"
 *                           count:
 *                             type: number
 *                             example: 5
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
    
    if (!kitchenId) {
      return ResponseFactory.validationError('Kitchen ID is required');
    }

    const convex = getConvexClient();
    
    // Get chef ID from kitchen
    const chefId = await convex.query(
      (api as any).queries.kitchens.getChefByKitchenId,
      { kitchenId }
    );

    if (!chefId) {
      return ResponseFactory.notFound('Chef not found for this kitchen');
    }

    // Get categories by chef
    const categories = await convex.query(
      (api as any).queries.meals.getCategoriesByChefId,
      {
        chefId,
      }
    );

    return ResponseFactory.success({ categories }, 'Categories retrieved successfully');

  } catch (error: unknown) {
    console.error('Get categories error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve categories')
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

