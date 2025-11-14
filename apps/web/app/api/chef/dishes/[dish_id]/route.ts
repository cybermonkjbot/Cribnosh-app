import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getSessionTokenFromRequest } from '@/lib/conxed-client';
import { fetchMutation } from 'convex/nextjs';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { fetchQuery } from 'convex/nextjs';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

type MealId = Id<'meals'>;

// Helper function to get a meal by ID since we don't have a direct query for it
async function getMealById(mealId: MealId, sessionToken: string | null) {
  const meals = await fetchQuery(api.queries.meals.getAll, {
    sessionToken: sessionToken || undefined
  });
  return meals.find((meal: any) => meal._id === mealId);
}

/**
 * @swagger
 * /chef/dishes/{dish_id}:
 *   patch:
 *     summary: Update Dish
 *     description: Update a dish/meal created by the authenticated chef
 *     tags: [Chef, Dishes, Meals]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the dish
 *                 example: "Updated Italian Pasta"
 *               description:
 *                 type: string
 *                 description: Updated description
 *                 example: "Updated description with new ingredients"
 *               price:
 *                 type: number
 *                 description: Updated price
 *                 example: 18.99
 *               cuisine:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated cuisine types
 *                 example: ["italian", "pasta"]
 *               dietary:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated dietary information
 *                 example: ["vegetarian", "gluten-free"]
 *               status:
 *                 type: string
 *                 enum: [draft, active, inactive, archived]
 *                 description: Updated status
 *                 example: "active"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated image URLs
 *                 example: ["https://example.com/new-image.jpg"]
 *     responses:
 *       200:
 *         description: Dish updated successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Dish updated successfully"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - invalid request body
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
 *         description: Forbidden - only chefs can update dishes or not the owner
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
 *     security:
 *       - cookieAuth: []
 *   delete:
 *     summary: Delete Dish
 *     description: Delete a dish/meal created by the authenticated chef
 *     tags: [Chef, Dishes, Meals]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Dish deleted successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Dish deleted successfully"
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
 *         description: Forbidden - only chefs can delete dishes or not the owner
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
 *     security:
 *       - cookieAuth: []
 */
async function handlePATCH(request: NextRequest, { params }: { params: { dish_id: string } }): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);
    const updates = await request.json();
    const sessionToken = getSessionTokenFromRequest(request);
    // Fetch dish and check ownership
    const dish = await getMealById(params.dish_id as MealId, sessionToken);
    if (!dish) {
      return ResponseFactory.notFound('Dish not found');
    }
    // Check if the current user is the owner of the dish
    if (dish.chefId !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own dishes.');
    }
    // Update the dish
    try {
      await fetchMutation(api.mutations.meals.updateMeal, { 
        mealId: params.dish_id as MealId, 
        ...updates,
        sessionToken: sessionToken || undefined
      });
      return ResponseFactory.success({ success: true, message: 'Dish updated successfully' });
    } catch (error) {
      logger.error('Error updating dish:', error);
      return ResponseFactory.error('Failed to update dish', 'CUSTOM_ERROR', 500);
    }
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update dish.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleDELETE(request: NextRequest, { params }: { params: { dish_id: string } }): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);
    const sessionToken = getSessionTokenFromRequest(request);
    // Fetch dish and check ownership
    const dish = await getMealById(params.dish_id as MealId, sessionToken);
    if (!dish) {
      return ResponseFactory.notFound('Dish not found');
    }
    // Check if the current user is the owner of the dish
    if (dish.chefId !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only delete your own dishes.');
    }
    // Delete the dish
    try {
      await fetchMutation(api.mutations.meals.deleteMeal, { 
        mealId: params.dish_id as MealId,
        sessionToken: sessionToken || undefined
      });
      return ResponseFactory.success({ success: true, message: 'Dish deleted successfully' });
    } catch (error) {
      logger.error('Error deleting dish:', error);
      return ResponseFactory.error('Failed to delete dish', 'CUSTOM_ERROR', 500);
    }
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete dish.';
    return ResponseFactory.internalError(errorMessage);
  }
}

// Route handlers with proper typing
export const PATCH = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const dish_id = pathParts[pathParts.length - 1];
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id parameter');
    }
    return handlePATCH(request, { params: { dish_id } });
  })
);

export const DELETE = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const dish_id = pathParts[pathParts.length - 1];
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id parameter');
    }
    return handleDELETE(request, { params: { dish_id } });
  })
);
