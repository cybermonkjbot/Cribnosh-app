import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/customer/meals/similar/{meal_id}:
 *   get:
 *     summary: Get Similar Meals
 *     description: Get meals similar to the specified meal, respecting user preferences
 *     tags: [Customer, Meals, Recommendations]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: meal_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the meal to find similar meals for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of similar meals to return
 *     responses:
 *       200:
 *         description: Similar meals retrieved successfully
 *       400:
 *         description: Missing meal_id parameter
 *       404:
 *         description: Meal not found
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { meal_id: string } }
): Promise<NextResponse> {
  try {
    const { meal_id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!meal_id) {
      return ResponseFactory.validationError('meal_id parameter is required');
    }

    // Extract userId from request (optional for similar meals)
    const userId = extractUserIdFromRequest(request);

    const convex = getConvexClient();
    
    // Get similar meals with user preferences
    const similarMeals = await convex.query((api as any).queries.mealRecommendations.getSimilar, {
      mealId: meal_id as Id<'meals'>,
      userId: userId || undefined,
      limit,
    });

    if (similarMeals.length === 0) {
      // Check if the meal exists
      const meal = await convex.query((api as any).queries.meals.getById, { 
        mealId: meal_id as Id<'meals'> 
      });
      
      if (!meal) {
        return ResponseFactory.notFound('Meal not found');
      }
    }

    // Transform similar meals to match mobile app expected format
    const dishes = similarMeals.map((meal: any) => ({
      id: meal._id || meal.id,
      name: meal.name,
      description: meal.description || '',
      price: meal.price || 0,
      imageUrl: meal.images?.[0] || meal.image_url || '',
      cuisine: meal.cuisine || [],
      dietary: meal.dietary || [],
      rating: meal.averageRating || meal.rating || 0,
      reviewCount: meal.reviewCount || 0,
      chefId: meal.chefId || meal.chef?._id,
      chef: meal.chef || null,
    }));

    return ResponseFactory.success({ 
      dishes,
      total: similarMeals.length,
    }, 'Similar meals retrieved successfully');

  } catch (error: any) {
    console.error('Get similar meals error:', error);
    return ResponseFactory.internalError(
      error.message || 'Failed to retrieve similar meals'
    );
  }
}

// Wrapper function to extract params from URL
export const GET = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const mealIdIndex = pathParts.indexOf('similar') + 1;
    const meal_id = pathParts[mealIdIndex];
    return handleGET(request, { params: { meal_id } });
  })
);

