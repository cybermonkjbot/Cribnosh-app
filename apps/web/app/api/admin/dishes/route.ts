import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /admin/dishes:
 *   get:
 *     summary: Get All Dishes
 *     description: Retrieve all dishes/meals from all chefs (admin only)
 *     tags: [Admin, Dishes, Meals]
 *     responses:
 *       200:
 *         description: All dishes retrieved successfully
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
 *                       description: Array of all dishes/meals
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
 *         description: Forbidden - only admins can access this endpoint
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
 *     summary: Create New Dish (Admin)
 *     description: Create a new dish/meal item (admin only)
 *     tags: [Admin, Dishes, Meals]
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
 *         description: Dish created successfully
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
 *                     mealId:
 *                       type: string
 *                       description: ID of the created dish
 *                       example: "j1234567890abcdef"
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
 *         description: Forbidden - only admins can create dishes
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
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
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    const meals = await convex.query(api.queries.meals.getAll, {});
    return ResponseFactory.success({ meals });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch meals.' );
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
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
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can create meals.');
    }
    const body = await request.json();
    const { name, description, chefId, price, images, cuisine, dietary } = body;
    if (!name || !chefId || !price) {
      return ResponseFactory.validationError('Missing required fields.');
    }
    const convex = getConvexClient();
    const mealId = await convex.mutation(api.mutations.meals.createMeal, {
      name,
      description: description || '',
      chefId,
      price,
      images: images || [],
      cuisine: cuisine || [],
      dietary: dietary || [],
      status: 'available',
    });
    return ResponseFactory.success({ success: true, mealId });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to create meal.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 