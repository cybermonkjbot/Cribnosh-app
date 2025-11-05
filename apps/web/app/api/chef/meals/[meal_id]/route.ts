import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /chef/meals/{meal_id}:
 *   put:
 *     summary: Update Meal
 *     description: Update a specific meal created by the authenticated chef
 *     tags: [Chef, Meals]
 *     parameters:
 *       - in: path
 *         name: meal_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
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
 *                 description: Updated name of the meal
 *                 example: "Updated Italian Pasta"
 *               description:
 *                 type: string
 *                 description: Updated description
 *                 example: "Updated description with new ingredients"
 *               price:
 *                 type: number
 *                 description: Updated price
 *                 example: 18.99
 *               category:
 *                 type: string
 *                 description: Updated category/cuisine type
 *                 example: "italian"
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated list of ingredients
 *                 example: ["pasta", "tomatoes", "basil", "parmesan"]
 *               allergens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated list of allergens
 *                 example: ["gluten", "dairy"]
 *               image:
 *                 type: string
 *                 description: Updated image URL
 *                 example: "https://example.com/updated-meal-image.jpg"
 *               preparationTime:
 *                 type: number
 *                 description: Updated preparation time in minutes
 *                 example: 35
 *               servings:
 *                 type: number
 *                 description: Updated number of servings
 *                 example: 3
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Updated status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Meal updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing or invalid meal_id
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
 *         description: Forbidden - only chefs can update meals or not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Meal not found or chef profile not found
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
 *     summary: Delete Meal
 *     description: Delete a specific meal created by the authenticated chef
 *     tags: [Chef, Meals]
 *     parameters:
 *       - in: path
 *         name: meal_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Meal deleted successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing or invalid meal_id
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
 *         description: Forbidden - only chefs can delete meals or not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Meal not found or chef profile not found
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
async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract meal_id from URL path since middleware doesn't pass params
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const meal_id = pathParts[pathParts.length - 1];
    
    if (!meal_id || meal_id === 'undefined') {
      return ResponseFactory.validationError('Missing or invalid meal_id parameter.');
    }
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    
    if (!payload.roles?.includes('chef')) {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access this endpoint.');
    }
    
    const body = await request.json();
    const { name, description, price, category, ingredients, allergens, image, preparationTime, servings, status } = body;
    
    const convex = getConvexClient();
    
    // Get chef profile first
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId: payload.user_id });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Verify the meal belongs to this chef
    const meal = await convex.query(api.queries.meals.getById, { mealId: meal_id as Id<'meals'> });
    if (!meal) {
      return ResponseFactory.notFound('Meal not found.');
    }
    
    if (meal.chefId !== chef._id) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own meals.');
    }
    
    // Update meal
    await convex.mutation(api.mutations.meals.updateMeal, {
      mealId: meal_id as Id<'meals'>,
      updates: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(category && { cuisine: [category] }),
        ...(allergens && { dietary: allergens }),
        ...(image !== undefined && { images: image ? [image] : [] }),
        ...(status && { status: status === 'active' ? 'available' : 'unavailable' })
      }
    });
    
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to update meal.' );
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract meal_id from URL path since middleware doesn't pass params
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const meal_id = pathParts[pathParts.length - 1];
    
    if (!meal_id || meal_id === 'undefined') {
      return ResponseFactory.validationError('Missing or invalid meal_id parameter.');
    }
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    
    if (!payload.roles?.includes('chef')) {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access this endpoint.');
    }
    
    const convex = getConvexClient();
    
    // Get chef profile first
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId: payload.user_id });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Verify the meal belongs to this chef
    const meal = await convex.query(api.queries.meals.getById, { mealId: meal_id as Id<'meals'> });
    if (!meal) {
      return ResponseFactory.notFound('Meal not found.');
    }
    
    if (meal.chefId !== chef._id) {
      return ResponseFactory.forbidden('Forbidden: You can only delete your own meals.');
    }
    
    // Delete meal
    await convex.mutation(api.mutations.meals.deleteMeal, {
      mealId: meal_id as Id<'meals'>
    });
    
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to delete meal.' );
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE)); 