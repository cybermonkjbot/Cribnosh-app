import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import type { JWTPayload } from '@/types/convex-contexts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /api/customer/dishes/{dishId}/favorite:
 *   get:
 *     summary: Check if dish/meal is favorited
 *     description: Check if the current user has favorited a dish/meal
 *     tags: [Customer, Dishes, Favorites]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: dishId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dish/meal
 *     responses:
 *       200:
 *         description: Favorite status retrieved successfully
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
 *                     isFavorited:
 *                       type: boolean
 *                       example: true
 *                     favoriteId:
 *                       type: string
 *                       nullable: true
 *                 message:
 *                   type: string
 *                   example: "Favorite status retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dish not found
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { dish_id: string } }
): Promise<NextResponse> {
  try {
    const { dish_id: dishId } = params;

    if (!dishId) {
      return ResponseFactory.validationError('Dish ID is required');
    }

    // Get user from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    if (!payload.user_id) {
      return ResponseFactory.unauthorized('Invalid token: missing user_id.');
    }

    const userId = payload.user_id;
    const convex = getConvexClient();

    // Verify the meal exists
    const meal = await convex.query((api as any).queries.meals.getById, { mealId: dishId as any });
    
    if (!meal) {
      return ResponseFactory.notFound('Meal not found');
    }

    // Check favorite status
    const favoriteStatus = await convex.query(
      (api as any).queries.userFavorites.isMealFavorited,
      { userId: userId as any, mealId: dishId as any }
    );

    return ResponseFactory.success(favoriteStatus, 'Favorite status retrieved successfully');

  } catch (error: unknown) {
    console.error('Favorite status retrieval error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve favorite status')
    );
  }
}

/**
 * @swagger
 * /api/customer/dishes/{dishId}/favorite:
 *   post:
 *     summary: Add dish/meal to favorites
 *     description: Add a dish/meal to the user's favorites
 *     tags: [Customer, Dishes, Favorites]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: dishId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dish/meal
 *     responses:
 *       200:
 *         description: Dish added to favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dish not found
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { dish_id: string } }
): Promise<NextResponse> {
  try {
    const { dish_id: dishId } = params;

    if (!dishId) {
      return ResponseFactory.validationError('Dish ID is required');
    }

    // Get user from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    if (!payload.user_id) {
      return ResponseFactory.unauthorized('Invalid token: missing user_id.');
    }

    const userId = payload.user_id;
    const convex = getConvexClient();

    // Verify the meal exists
    const meal = await convex.query((api as any).queries.meals.getById, { mealId: dishId as any });
    
    if (!meal) {
      return ResponseFactory.notFound('Meal not found');
    }

    // Add to favorites
    await convex.mutation((api as any).mutations.userFavorites.addMealFavorite, {
      userId: userId as any,
      mealId: dishId as any,
    });

    return ResponseFactory.success(null, 'Dish added to favorites successfully');

  } catch (error: unknown) {
    console.error('Add favorite error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to add dish to favorites')
    );
  }
}

/**
 * @swagger
 * /api/customer/dishes/{dishId}/favorite:
 *   delete:
 *     summary: Remove dish/meal from favorites
 *     description: Remove a dish/meal from the user's favorites
 *     tags: [Customer, Dishes, Favorites]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: dishId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dish/meal
 *     responses:
 *       200:
 *         description: Dish removed from favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dish not found
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { dish_id: string } }
): Promise<NextResponse> {
  try {
    const { dish_id: dishId } = params;

    if (!dishId) {
      return ResponseFactory.validationError('Dish ID is required');
    }

    // Get user from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    if (!payload.user_id) {
      return ResponseFactory.unauthorized('Invalid token: missing user_id.');
    }

    const userId = payload.user_id;
    const convex = getConvexClient();

    // Verify the meal exists
    const meal = await convex.query((api as any).queries.meals.getById, { mealId: dishId as any });
    
    if (!meal) {
      return ResponseFactory.notFound('Meal not found');
    }

    // Remove from favorites
    await convex.mutation((api as any).mutations.userFavorites.removeMealFavorite, {
      userId: userId as any,
      mealId: dishId as any,
    });

    return ResponseFactory.success(null, 'Dish removed from favorites successfully');

  } catch (error: unknown) {
    console.error('Remove favorite error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to remove dish from favorites')
    );
  }
}

// Wrapper functions to extract params from URL
export const GET = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const dishIdIndex = pathParts.indexOf('dishes') + 1;
    const dishId = pathParts[dishIdIndex];
    return handleGET(request, { params: { dish_id: dishId } });
  })
);

export const POST = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const dishIdIndex = pathParts.indexOf('dishes') + 1;
    const dishId = pathParts[dishIdIndex];
    return handlePOST(request, { params: { dish_id: dishId } });
  })
);

export const DELETE = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const dishIdIndex = pathParts.indexOf('dishes') + 1;
    const dishId = pathParts[dishIdIndex];
    return handleDELETE(request, { params: { dish_id: dishId } });
  })
);

