import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

interface JWTPayload {
  user_id: string;
  role: string;
}

type MealId = Id<'meals'>;

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

// Helper function to get a meal by ID since we don't have a direct query for it
async function getMealById(convex: ConvexHttpClient, mealId: MealId) {
  const meals = await convex.query(api.queries.meals.getAll, {});
  return meals.find((meal) => meal._id === mealId);
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
 *       - bearerAuth: []
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
 *       - bearerAuth: []
 */
async function handlePATCH(request: NextRequest, { params }: { params: { dish_id: string } }): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === 'string') {
        return ResponseFactory.unauthorized('Invalid token format.');
      }
      payload = verified as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'chef') {
      return ResponseFactory.forbidden('Forbidden: Only chefs can update dishes.');
    }
    const updates = await request.json();
    const convex = getConvexClient();
    // Fetch dish and check ownership
    const dish = await getMealById(convex, params.dish_id as MealId);
    if (!dish) {
      return ResponseFactory.notFound('Dish not found');
    }
    // Check if the current user is the owner of the dish
    if (dish.chefId !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own dishes.');
    }
    // Update the dish
    try {
      await convex.mutation(api.mutations.meals.updateMeal, { 
        mealId: params.dish_id as MealId, 
        ...updates 
      });
      return ResponseFactory.success({ success: true, message: 'Dish updated successfully' });
    } catch (error) {
      console.error('Error updating dish:', error);
      return ResponseFactory.error('Failed to update dish', 'CUSTOM_ERROR', 500);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update dish.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleDELETE(request: NextRequest, { params }: { params: { dish_id: string } }): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === 'string') {
        return ResponseFactory.unauthorized('Invalid token format.');
      }
      payload = verified as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'chef') {
      return ResponseFactory.forbidden('Forbidden: Only chefs can delete dishes.');
    }
    const convex = getConvexClient();
    // Fetch dish and check ownership
    const dish = await getMealById(convex, params.dish_id as MealId);
    if (!dish) {
      return ResponseFactory.notFound('Dish not found');
    }
    // Check if the current user is the owner of the dish
    if (dish.chefId !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only delete your own dishes.');
    }
    // Delete the dish
    try {
      await convex.mutation(api.mutations.meals.deleteMeal, { 
        mealId: params.dish_id as MealId 
      });
      return ResponseFactory.success({ success: true, message: 'Dish deleted successfully' });
    } catch (error) {
      console.error('Error deleting dish:', error);
      return ResponseFactory.error('Failed to delete dish', 'CUSTOM_ERROR', 500);
    }
  } catch (error: unknown) {
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
