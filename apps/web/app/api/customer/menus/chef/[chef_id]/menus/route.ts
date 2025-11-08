import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

// Endpoint: /v1/customer/menus/chef/{chef_id}/menus
// Group: customer

/**
 * @swagger
 * /customer/menus/chef/{chef_id}/menus:
 *   get:
 *     summary: Get Chef Menu Items
 *     description: Retrieve all menu items/dishes from a specific chef
 *     tags: [Customer, Menus, Chefs]
 *     parameters:
 *       - in: path
 *         name: chef_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chef ID
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Chef menu items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of menu items from the chef
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Menu item ID
 *                         example: "j1234567890abcdef"
 *                       chefId:
 *                         type: string
 *                         description: Chef ID
 *                         example: "j1234567890abcdef"
 *                       name:
 *                         type: string
 *                         description: Menu item name
 *                         example: "Chicken Tikka Masala"
 *                       description:
 *                         type: string
 *                         description: Menu item description
 *                         example: "Tender chicken in creamy tomato sauce"
 *                       price:
 *                         type: number
 *                         description: Menu item price
 *                         example: 15.99
 *                       cuisine:
 *                         type: string
 *                         description: Cuisine type
 *                         example: "indian"
 *                       ingredients:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: List of ingredients
 *                         example: ["chicken", "tomato", "cream", "spices"]
 *                       dietaryInfo:
 *                         type: object
 *                         description: Dietary information
 *                         properties:
 *                           vegetarian:
 *                             type: boolean
 *                             example: false
 *                           vegan:
 *                             type: boolean
 *                             example: false
 *                           glutenFree:
 *                             type: boolean
 *                             example: true
 *                           allergens:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["dairy"]
 *                       prepTime:
 *                         type: number
 *                         description: Preparation time in minutes
 *                         example: 30
 *                       servings:
 *                         type: number
 *                         description: Number of servings
 *                         example: 2
 *                       image:
 *                         type: string
 *                         nullable: true
 *                         description: Menu item image URL
 *                         example: "https://example.com/dish-image.jpg"
 *                       status:
 *                         type: string
 *                         enum: [draft, active, inactive, archived]
 *                         description: Menu item status
 *                         example: "active"
 *                       rating:
 *                         type: number
 *                         nullable: true
 *                         description: Average rating
 *                         example: 4.5
 *                       reviewCount:
 *                         type: number
 *                         description: Number of reviews
 *                         example: 12
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Creation timestamp
 *                         example: "2024-01-15T10:00:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing or invalid chef_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef not found
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/chef\/([^/]+)\/menus/);
  const chef_id = match ? match[1] : undefined;
  if (!chef_id) {
    return ResponseFactory.validationError('Missing chef_id');
  }
  let chefId: Id<'chefs'>;
  try {
    chefId = chef_id as Id<'chefs'>;
  } catch {
    return ResponseFactory.validationError('Invalid chef_id');
  }
  try {
    const convex = getConvexClientFromRequest(request);
    const meals = await convex.query(api.queries.chefs.getMenusByChefId, { chefId });
    // Return the meals array as-is, since each meal is not a menu with items
    return ResponseFactory.success(Array.isArray(meals) ? meals : []);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
