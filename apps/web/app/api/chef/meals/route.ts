import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';

/**
 * @swagger
 * /chef/meals:
 *   get:
 *     summary: Get Chef Meals
 *     description: Retrieve meals created by the authenticated chef
 *     tags: [Chef, Meals]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of meals to return
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of meals to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Chef meals retrieved successfully
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
 *                     meals:
 *                       type: array
 *                       description: Array of chef's meals
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Meal ID
 *                             example: "j1234567890abcdef"
 *                           chefId:
 *                             type: string
 *                             description: Chef ID who created the meal
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Meal name
 *                             example: "Authentic Italian Pasta"
 *                           description:
 *                             type: string
 *                             description: Meal description
 *                             example: "Handmade pasta with fresh ingredients"
 *                           price:
 *                             type: number
 *                             description: Meal price
 *                             example: 15.99
 *                           cuisine:
 *                             type: string
 *                             description: Cuisine type
 *                             example: "italian"
 *                           ingredients:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: List of ingredients
 *                             example: ["pasta", "tomatoes", "basil", "parmesan"]
 *                           dietaryInfo:
 *                             type: object
 *                             description: Dietary information
 *                             properties:
 *                               vegetarian:
 *                                 type: boolean
 *                                 example: true
 *                               vegan:
 *                                 type: boolean
 *                                 example: false
 *                               glutenFree:
 *                                 type: boolean
 *                                 example: false
 *                               allergens:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                                 example: ["dairy"]
 *                           prepTime:
 *                             type: number
 *                             description: Preparation time in minutes
 *                             example: 30
 *                           servings:
 *                             type: number
 *                             description: Number of servings
 *                             example: 2
 *                           image:
 *                             type: string
 *                             nullable: true
 *                             description: Meal image URL
 *                             example: "https://example.com/meal-image.jpg"
 *                           status:
 *                             type: string
 *                             enum: [draft, active, inactive, archived]
 *                             description: Meal status
 *                             example: "active"
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average rating
 *                             example: 4.5
 *                           reviewCount:
 *                             type: number
 *                             description: Number of reviews
 *                             example: 25
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Creation timestamp
 *                             example: "2024-01-15T10:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Last update timestamp
 *                             example: "2024-01-15T15:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only chefs can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef profile not found
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
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create New Meal
 *     description: Create a new meal/dish for the authenticated chef
 *     tags: [Chef, Meals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the meal
 *                 example: "Authentic Italian Pasta"
 *               description:
 *                 type: string
 *                 description: Detailed description of the meal
 *                 example: "Handmade pasta with fresh ingredients and traditional Italian sauce"
 *               price:
 *                 type: number
 *                 description: Price of the meal
 *                 example: 15.99
 *               category:
 *                 type: string
 *                 description: Meal category/cuisine type
 *                 example: "italian"
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of ingredients
 *                 example: ["pasta", "tomatoes", "basil", "parmesan"]
 *               allergens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of allergens
 *                 example: ["gluten", "dairy"]
 *               image:
 *                 type: string
 *                 description: Image URL for the meal
 *                 example: "https://example.com/meal-image.jpg"
 *               preparationTime:
 *                 type: number
 *                 description: Preparation time in minutes
 *                 example: 30
 *               servings:
 *                 type: number
 *                 description: Number of servings
 *                 example: 2
 *     responses:
 *       200:
 *         description: Meal created successfully
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
 *                     mealId:
 *                       type: string
 *                       description: ID of the created meal
 *                       example: "j1234567890abcdef"
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only chefs can create meals
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef profile not found
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
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const convex = getConvexClient();
    
    // Get chef profile first
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Get meals for this chef
    const meals = await convex.query(api.queries.meals.getByChefId, { 
      chefId: chef._id,
      limit,
      offset 
    });
    
    return ResponseFactory.success({ meals });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch meals.'));
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const body = await request.json();
    const { name, description, price, category, ingredients, allergens, image, preparationTime, servings } = body;
    
    if (!name || !description || !price || !category) {
      return ResponseFactory.validationError('Missing required fields: name, description, price, category');
    }
    
    const convex = getConvexClient();
    
    // Get chef profile first
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Create meal
    const mealId = await convex.mutation(api.mutations.meals.createMeal, {
      chefId: chef._id,
      name,
      description,
      price,
      cuisine: [category], // Map category to cuisine array
      dietary: allergens || [], // Map allergens to dietary array
      status: 'available',
      images: image ? [image] : [],
      rating: 0
    });
    
    return ResponseFactory.success({ mealId, success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create meal.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 