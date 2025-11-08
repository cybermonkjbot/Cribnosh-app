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

import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getApiQueries, getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import type { FunctionReference } from 'convex/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Type definitions for data structures
interface ChefData {
  _id: Id<'chefs'>;
  name?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  profileImage?: string | null;
  [key: string]: unknown;
}

interface ReviewData {
  rating?: number;
  chef_id?: Id<'chefs'>;
  [key: string]: unknown;
}

interface MealData {
  _id?: Id<'meals'>;
  chefId?: Id<'chefs'>;
  [key: string]: unknown;
}

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
    // Extract userId from request (optional for public endpoints)
    const userId = extractUserIdFromRequest(request);
    
    // Get chef details, reviews, and meals using type-safe accessors
    const apiQueries = getApiQueries();
    type ChefByIdQuery = FunctionReference<"query", "public", { chefId: Id<'chefs'> }, ChefData | null>;
    type ReviewsByChefQuery = FunctionReference<"query", "public", { chef_id: string }, ReviewData[]>;
    type MealsQuery = FunctionReference<"query", "public", { userId?: string }, MealData[]>;
    
    const [chef, reviews, allMeals] = await Promise.all([
      convex.query((apiQueries.chefs.getChefById as unknown as ChefByIdQuery), { 
        chefId: chef_id as Id<'chefs'> 
      }) as Promise<ChefData | null>,
      convex.query((apiQueries.reviews.getByChef as unknown as ReviewsByChefQuery), { chef_id }) as Promise<ReviewData[]>,
      convex.query((apiQueries.meals.getAll as unknown as MealsQuery), { userId }) as Promise<MealData[]>
    ]);
    
    if (!chef) {
      return ResponseFactory.notFound('Chef not found');
    }

    // Filter meals for this chef
    const meals = allMeals.filter((meal: MealData) => meal.chefId === chef_id);

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
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
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
