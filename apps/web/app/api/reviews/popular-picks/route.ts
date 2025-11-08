/**
 * @swagger
 * components:
 *   schemas:
 *     PopularMeal:
 *       type: object
 *       properties:
 *         mealId:
 *           type: string
 *           description: Unique identifier for the meal
 *         meal:
 *           type: object
 *           description: Meal details
 *         avgRating:
 *           type: number
 *           description: Average rating for the meal
 *         reviewCount:
 *           type: number
 *           description: Number of reviews for the meal
 *         chef:
 *           type: object
 *           nullable: true
 *           description: Chef information
 *     PopularPicksResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             popular:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PopularMeal'
 *         message:
 *           type: string
 *           example: "Success"
 */

import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/reviews/popular-picks
// Group: reviews

/**
 * @swagger
 * /api/reviews/popular-picks:
 *   get:
 *     summary: Get popular meal picks
 *     description: Retrieve the most popular meals based on review count and average rating
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Popular meal picks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PopularPicksResponse'
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const convex = getConvexClientFromRequest(request);
    
    // Extract userId from request (optional for public endpoints)
    const userId = extractUserIdFromRequest(request);
  
  // Get all reviews, meals, and chefs using the correct query references
  // Apply user preferences to meals
  const reviews = await convex.query((api as any).queries.reviews.getAll, {});
  const meals = await convex.query((api as any).queries.meals.getAll, { userId });
  const chefs = await convex.query((api as any).queries.chefs.getAll, {});

  // Aggregate reviews by meal_id
  const mealReviewMap: Record<string, { total: number; count: number; meal: any }> = {};
  for (const review of reviews) {
    if (!review.meal_id) continue;
    if (!mealReviewMap[review.meal_id]) {
      mealReviewMap[review.meal_id] = { total: 0, count: 0, meal: meals.find((m: any) => m._id === review.meal_id) };
    }
    mealReviewMap[review.meal_id].total += review.rating;
    mealReviewMap[review.meal_id].count += 1;
  }
  // Compute average rating and sort by count and rating
  const popularMeals = Object.entries(mealReviewMap)
    .map(([mealId, { total, count, meal }]) => ({
      mealId,
      meal,
      avgRating: total / count,
      reviewCount: count,
      chef: chefs.find((c: any) => c._id === meal?.chefId) || null,
    }))
    .filter(entry => entry.meal && entry.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount || b.avgRating - a.avgRating)
    .slice(0, 10);

    return ResponseFactory.success({ popular: popularMeals });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 