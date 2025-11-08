import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /chef/dishes:
 *   get:
 *     summary: Get Chef Dishes
 *     description: Retrieve dishes/menu items created by the authenticated chef
 *     tags: [Chef, Dishes, Meals]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of dishes to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of dishes to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Chef dishes retrieved successfully
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
 *                     chef_profile:
 *                       type: object
 *                       description: Chef profile information
 *                       properties:
 *                         chefId:
 *                           type: string
 *                           description: Chef ID
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           example: "Chef Mario"
 *                         specialties:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["italian", "pasta"]
 *                         location:
 *                           type: object
 *                           properties:
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: number
 *                               example: [-0.1276, 51.5074]
 *                             address:
 *                               type: string
 *                               example: "123 Baker Street, London"
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         rating:
 *                           type: number
 *                           example: 4.8
 *                     dishes:
 *                       type: array
 *                       description: Array of chef's dishes
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Dish ID
 *                             example: "j1234567890abcdef"
 *                           chefId:
 *                             type: string
 *                             description: Chef ID who created the dish
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Dish name
 *                             example: "Spaghetti Carbonara"
 *                           description:
 *                             type: string
 *                             description: Dish description
 *                             example: "Classic Italian pasta with eggs, cheese, and pancetta"
 *                           price:
 *                             type: number
 *                             description: Dish price
 *                             example: 18.99
 *                           cuisine:
 *                             type: string
 *                             description: Cuisine type
 *                             example: "italian"
 *                           ingredients:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: List of ingredients
 *                             example: ["pasta", "eggs", "parmesan", "pancetta"]
 *                           dietaryInfo:
 *                             type: object
 *                             description: Dietary information
 *                             properties:
 *                               vegetarian:
 *                                 type: boolean
 *                                 example: false
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
 *                                 example: ["eggs", "dairy"]
 *                           prepTime:
 *                             type: number
 *                             description: Preparation time in minutes
 *                             example: 25
 *                           servings:
 *                             type: number
 *                             description: Number of servings
 *                             example: 2
 *                           image:
 *                             type: string
 *                             nullable: true
 *                             description: Dish image URL
 *                             example: "https://example.com/dish-image.jpg"
 *                           status:
 *                             type: string
 *                             enum: [draft, active, inactive, archived]
 *                             description: Dish status
 *                             example: "active"
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average rating
 *                             example: 4.7
 *                           reviewCount:
 *                             type: number
 *                             description: Number of reviews
 *                             example: 15
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
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    const convex = getConvexClient();
    // Find chef profile by userId
    const chefs = await convex.query(api.queries.chefs.getAllChefLocations, {});
    const chef = chefs.find((c: { userId?: string }) => c.userId === userId);
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Fetch meals for this chef
    const chefDishes = await convex.query(api.queries.chefs.getMenusByChefId, { chefId: chef.chefId });
    // Consistent ordering (createdAt DESC)
    chefDishes.sort((a: { createdAt?: number }, b: { createdAt?: number }) => (b.createdAt || 0) - (a.createdAt || 0));
    const paginated = chefDishes.slice(offset, offset + limit);
    return ResponseFactory.success({
      chef_profile: chef,
      dishes: paginated
    });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 