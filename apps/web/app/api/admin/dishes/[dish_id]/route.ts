// Implements GET, PUT, PATCH, DELETE for /admin/dishes/{dish_id}
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';

/**
 * @swagger
 * /admin/dishes/{dish_id}:
 *   get:
 *     summary: Get Specific Dish (Admin)
 *     description: Retrieve detailed information about a specific dish by ID for administrative review and management.
 *     tags: [Admin, Dishes, Meals]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the dish
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
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Dish ID
 *                           example: "j1234567890abcdef"
 *                         chefId:
 *                           type: string
 *                           description: Chef ID who created the dish
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           description: Dish name
 *                           example: "Spaghetti Carbonara"
 *                         description:
 *                           type: string
 *                           description: Dish description
 *                           example: "Classic Italian pasta with eggs, cheese, and pancetta"
 *                         price:
 *                           type: number
 *                           description: Dish price
 *                           example: 18.99
 *                         cuisine:
 *                           type: string
 *                           description: Cuisine type
 *                           example: "italian"
 *                         ingredients:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: List of ingredients
 *                           example: ["pasta", "eggs", "parmesan", "pancetta"]
 *                         dietaryInfo:
 *                           type: object
 *                           properties:
 *                             vegetarian:
 *                               type: boolean
 *                               example: false
 *                             vegan:
 *                               type: boolean
 *                               example: false
 *                             glutenFree:
 *                               type: boolean
 *                               example: false
 *                             allergens:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["eggs", "dairy"]
 *                         prepTime:
 *                           type: number
 *                           description: Preparation time in minutes
 *                           example: 25
 *                         servings:
 *                           type: number
 *                           description: Number of servings
 *                           example: 2
 *                         image:
 *                           type: string
 *                           nullable: true
 *                           description: Dish image URL
 *                           example: "https://example.com/dish-image.jpg"
 *                         status:
 *                           type: string
 *                           enum: [draft, active, inactive, archived]
 *                           description: Dish status
 *                           example: "active"
 *                         rating:
 *                           type: number
 *                           nullable: true
 *                           description: Average rating
 *                           example: 4.7
 *                         reviewCount:
 *                           type: number
 *                           description: Number of reviews
 *                           example: 15
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Creation timestamp
 *                           example: "2024-01-15T10:00:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Last update timestamp
 *                           example: "2024-01-15T15:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing dish_id parameter
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
 *         description: Forbidden - admin access required
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
 *   patch:
 *     summary: Update Dish (Admin)
 *     description: Partially update a dish's information. Only provided fields will be updated.
 *     tags: [Admin, Dishes, Meals]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the dish
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
 *                 description: Updated dish name
 *                 example: "Spaghetti Carbonara Deluxe"
 *               description:
 *                 type: string
 *                 description: Updated dish description
 *                 example: "Premium Italian pasta with organic eggs, aged parmesan, and artisanal pancetta"
 *               price:
 *                 type: number
 *                 description: Updated dish price
 *                 example: 22.99
 *               cuisine:
 *                 type: string
 *                 description: Updated cuisine type
 *                 example: "italian"
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated list of ingredients
 *                 example: ["organic pasta", "free-range eggs", "aged parmesan", "artisanal pancetta"]
 *               dietaryInfo:
 *                 type: object
 *                 properties:
 *                   vegetarian:
 *                     type: boolean
 *                     example: false
 *                   vegan:
 *                     type: boolean
 *                     example: false
 *                   glutenFree:
 *                     type: boolean
 *                     example: false
 *                   allergens:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["eggs", "dairy"]
 *               prepTime:
 *                 type: number
 *                 description: Updated preparation time in minutes
 *                 example: 30
 *               servings:
 *                 type: number
 *                 description: Updated number of servings
 *                 example: 2
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: Updated dish image URL
 *                 example: "https://example.com/updated-dish-image.jpg"
 *               status:
 *                 type: string
 *                 enum: [draft, active, inactive, archived]
 *                 description: Updated dish status
 *                 example: "active"
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing dish_id or invalid data
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
 *         description: Forbidden - admin access required
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
 *   put:
 *     summary: Replace Dish (Admin)
 *     description: Completely replace a dish's information with new data.
 *     tags: [Admin, Dishes, Meals]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the dish
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - chefId
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dish name
 *                 example: "Spaghetti Carbonara"
 *               description:
 *                 type: string
 *                 description: Dish description
 *                 example: "Classic Italian pasta with eggs, cheese, and pancetta"
 *               chefId:
 *                 type: string
 *                 description: Chef ID who created the dish
 *                 example: "j1234567890abcdef"
 *               price:
 *                 type: number
 *                 description: Dish price
 *                 example: 18.99
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image URLs
 *                 example: ["https://example.com/dish1.jpg", "https://example.com/dish2.jpg"]
 *               cuisine:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of cuisine types
 *                 example: ["italian", "pasta"]
 *               dietary:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of dietary information
 *                 example: ["vegetarian", "gluten-free"]
 *     responses:
 *       200:
 *         description: Dish replaced successfully
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
 *         description: Bad request - missing required fields or invalid data
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
 *         description: Forbidden - admin access required
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
 *     summary: Delete Dish (Admin)
 *     description: Permanently delete a dish from the system. This action cannot be undone.
 *     tags: [Admin, Dishes, Meals]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the dish
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing dish_id parameter
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
 *         description: Forbidden - admin access required
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

function extractDishIdFromUrl(request: NextRequest): Id<'meals'> | undefined {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/meals\/([^/]+)/);
  return match ? (match[1] as Id<'meals'>) : undefined;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const dish_id = extractDishIdFromUrl(request);
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id');
    }
    const convex = getConvexClient();
    const dishes = await convex.query(api.queries.meals.getAll);
    const dish = dishes.find((d: { _id: Id<'meals'> }) => d._id === dish_id);
    if (!dish) {
      return ResponseFactory.notFound('Dish not found');
    }
    return ResponseFactory.success({ dish });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handlePATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    
    const dish_id = extractDishIdFromUrl(request);
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id');
    }
    const updates = await request.json();
    const convex = getConvexClient();
    await convex.mutation(api.mutations.meals.updateMeal, {
      mealId: dish_id,
      ...updates,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    
    const dish_id = extractDishIdFromUrl(request);
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id');
    }
    const updates = await request.json();
    const convex = getConvexClient();
    await convex.mutation(api.mutations.meals.updateMeal, {
      mealId: dish_id,
      ...updates,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    
    const dish_id = extractDishIdFromUrl(request);
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id');
    }
    const convex = getConvexClient();
    await convex.mutation(api.mutations.meals.deleteMeal, { mealId: dish_id });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
