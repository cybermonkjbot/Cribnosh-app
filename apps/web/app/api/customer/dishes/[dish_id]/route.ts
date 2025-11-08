import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /customer/dishes/{dish_id}:
 *   get:
 *     summary: Get Dish Details
 *     description: Get detailed information about a specific dish by ID
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dish to retrieve
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Dish details retrieved successfully
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
 *                     dish:
 *                       type: object
 *                       description: Dish details
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Dish ID
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           description: Dish name
 *                           example: "Chicken Tikka Masala"
 *                         description:
 *                           type: string
 *                           description: Dish description
 *                           example: "Tender chicken in a rich, creamy tomato sauce with aromatic spices"
 *                         price:
 *                           type: number
 *                           description: Price of the dish
 *                           example: 15.99
 *                         cuisine:
 *                           type: array
 *                           description: Cuisine types
 *                           items:
 *                             type: string
 *                           example: ["Indian", "Asian"]
 *                         ingredients:
 *                           type: array
 *                           description: List of ingredients
 *                           items:
 *                             type: string
 *                           example: ["Chicken", "Tomatoes", "Cream", "Spices"]
 *                         allergens:
 *                           type: array
 *                           description: Allergen information
 *                           items:
 *                             type: string
 *                           example: ["Dairy", "Nuts"]
 *                         chef_id:
 *                           type: string
 *                           description: Chef who created this dish
 *                           example: "j1234567890abcdef"
 *                         image_url:
 *                           type: string
 *                           nullable: true
 *                           description: Dish image URL
 *                           example: "https://example.com/dish-image.jpg"
 *                         preparation_time:
 *                           type: number
 *                           nullable: true
 *                           description: Preparation time in minutes
 *                           example: 30
 *                         is_available:
 *                           type: boolean
 *                           description: Whether the dish is currently available
 *                           example: true
 *                         rating:
 *                           type: number
 *                           nullable: true
 *                           description: Average rating
 *                           example: 4.5
 *                         total_orders:
 *                           type: number
 *                           description: Total number of orders
 *                           example: 150
 *                         created_at:
 *                           type: number
 *                           description: Creation timestamp
 *                           example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing dish_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { dish_id: string } }
): Promise<NextResponse> {
  try {
    // Extract dish_id from URL path parameter
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const dishIdIndex = pathParts.indexOf('dishes') + 1;
    const dish_id = pathParts[dishIdIndex] || params?.dish_id;
    
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id parameter');
    }

    const convex = getConvexClientFromRequest(request);
    
    // Extract userId from request (optional for public endpoints)
    const userId = extractUserIdFromRequest(request);
    
    // Get all meals with user preferences and filter by ID
    const meals = await convex.query((api as any).queries.meals.getAll, { userId });
    const dish = meals.find((m: any) => m._id === dish_id);
    
    if (!dish) {
      return ResponseFactory.notFound('Dish not found.');
    }
    
    return ResponseFactory.success({ dish });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error fetching dish:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch dish.'));
  }
}

// Wrap the handler with middleware to extract params from URL
export const GET = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const dishIdIndex = pathParts.indexOf('dishes') + 1;
    const dishId = pathParts[dishIdIndex];
    return handleGET(request, { params: { dish_id: dishId } });
  })
);
