/**
 * @swagger
 * components:
 *   schemas:
 *     PopularChefResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             chef:
 *               type: object
 *               description: Chef details
 *             reviews:
 *               type: array
 *               description: Reviews for this chef
 *             averageRating:
 *               type: number
 *               description: Average rating for the chef
 *             reviewCount:
 *               type: number
 *               description: Total number of reviews
 *         message:
 *           type: string
 *           example: "Success"
 */

import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

type Review = {
  rating: number;
  // Add other review properties as needed
};

// Endpoint: /v1/customer/chefs/popular/{chef_id}
// Group: customer

/**
 * @swagger
 * /api/customer/chefs/popular/{chef_id}:
 *   get:
 *     summary: Get popular chef details
 *     description: Retrieve detailed information about a popular chef including reviews and ratings
 *     tags: [Customer Chefs]
 *     parameters:
 *       - in: path
 *         name: chef_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chef
 *     responses:
 *       200:
 *         description: Chef details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PopularChefResponse'
 *       400:
 *         description: Validation error - Missing chef_id
 *       404:
 *         description: Chef not found
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { chef_id: string } }
): Promise<NextResponse> {
  const { chef_id } = params;
  
  if (!chef_id) {
    return ResponseFactory.validationError('Missing chef_id');
  }

  const convex = getConvexClient();
  
  try {
    // Get chef details
    const chef = await convex.query(api.queries.chefs.getChefById, { 
      chefId: chef_id as Id<'chefs'> 
    });
    
    if (!chef) {
      return ResponseFactory.notFound('Chef not found');
    }

    // Get reviews and meals in parallel
    const [reviews, meals] = await Promise.all([
      convex.query(api.queries.reviews.getByChef, { chef_id }),
      convex.query(api.queries.meals.getAll, {}).then(meals => 
        meals.filter((meal: any) => meal.chefId === chef_id)
      )
    ]);

    // Calculate average rating with proper type annotations
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 
      ? (reviews as Review[]).reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewCount 
      : 0;

    return ResponseFactory.success({
      chef: chef,
      reviews: reviews,
      averageRating: avgRating,
      reviewCount: reviewCount
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch chef details');
  }
}

// Create a wrapped handler that works with the middleware
const wrappedHandler = (request: NextRequest) => {
  const { pathname } = new URL(request.url);
  const chefId = pathname.split('/').pop();
  return handleGET(request, { params: { chef_id: chefId || '' } });
};

// Export the wrapped handler with middleware
export const GET = withAPIMiddleware(withErrorHandling(wrappedHandler));
