import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getApiQueries, getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { FunctionReference } from 'convex/server';
import { NextRequest, NextResponse } from 'next/server';

// Type definition for meal data structure
interface MealData {
  cuisine?: string[];
  [key: string]: unknown;
}

/**
 * @swagger
 * /customer/cuisines:
 *   get:
 *     summary: Get Available Cuisines
 *     description: Get a list of all available cuisines from the meals database
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Cuisines retrieved successfully
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
 *                     cuisines:
 *                       type: array
 *                       description: Array of available cuisines
 *                       items:
 *                         type: string
 *                       example: ["Italian", "Indian", "Chinese", "Mexican", "Mediterranean"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  
  // Extract userId from request (optional for public endpoints)
  const userId = extractUserIdFromRequest(request);
  
  // Get cuisines from meals (with user preferences)
  const apiQueries = getApiQueries();
  type MealsQuery = FunctionReference<"query", "public", { userId?: string }, MealData[]>;
  const mealsQuery = (apiQueries.meals.getAll as unknown as MealsQuery);
  const meals = await convex.query(mealsQuery, { userId }) as MealData[];
  const cuisines = new Set<string>();
  
  for (const meal of meals) {
    if (meal.cuisine && Array.isArray(meal.cuisine)) {
      meal.cuisine.forEach((c: string) => cuisines.add(c));
    }
  }
  
  return ResponseFactory.success({ cuisines: Array.from(cuisines) });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  return ResponseFactory.error('Method not allowed', 'CUSTOM_ERROR', 405);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 