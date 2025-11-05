import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * @swagger
 * /customer/orders/recent-dishes:
 *   get:
 *     summary: Get Recent Dishes for Order Again
 *     description: Get dishes/meals from customer's past orders for quick reordering. Returns unique dishes ordered previously, sorted by most recent order.
 *     tags: [Customer, Orders]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of dishes to return
 *         example: 10
 *     responses:
 *       200:
 *         description: Recent dishes retrieved successfully
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
 *                     dishes:
 *                       type: array
 *                       description: Array of dishes from past orders
 *                       items:
 *                         type: object
 *                         properties:
 *                           dish_id:
 *                             type: string
 *                             description: Dish ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Dish name
 *                             example: "Chicken Tikka Masala"
 *                           price:
 *                             type: number
 *                             description: Dish price in pence
 *                             example: 1599
 *                           image_url:
 *                             type: string
 *                             nullable: true
 *                             description: Dish image URL
 *                             example: "https://example.com/dish.jpg"
 *                           kitchen_name:
 *                             type: string
 *                             description: Kitchen/Chef name
 *                             example: "Amara's Kitchen"
 *                           kitchen_id:
 *                             type: string
 *                             description: Kitchen/Chef ID
 *                             example: "j1234567890abcdef"
 *                           last_ordered_at:
 *                             type: number
 *                             description: Timestamp of last order
 *                             example: 1640995200000
 *                           order_count:
 *                             type: number
 *                             description: Number of times this dish was ordered
 *                             example: 3
 *                           has_bussin_badge:
 *                             type: boolean
 *                             description: Whether dish has high rating (>= 4.5)
 *                             example: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only customers can access this endpoint
 *       500:
 *         description: Internal server error
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
    
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access this endpoint.');
    }

    const convex = getConvexClient();
    
    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    // Get customer's past orders
    const orders = await convex.query(api.queries.orders.listByCustomer, {
      customer_id: payload.user_id,
      status: 'past',
      order_type: 'all',
    });

    // Extract unique dishes from orders with metadata
    const dishMap = new Map<string, {
      dish_id: string;
      name: string;
      price: number;
      image_url?: string;
      kitchen_name: string;
      kitchen_id: string;
      last_ordered_at: number;
      order_count: number;
      rating?: number;
    }>();

    // Process each order to extract dishes
    for (const order of orders) {
      if (!order.order_items || !Array.isArray(order.order_items)) continue;

      for (const item of order.order_items) {
        const dishId = item.dish_id || item.dishId;
        if (!dishId) continue;

        // Get dish details if not already in map
        if (!dishMap.has(dishId)) {
          // Fetch meal details
          const meal = await convex.query(api.queries.meals.getById, { mealId: dishId as any });
          if (!meal) continue;

          // Get chef/kitchen details
          const chef = await convex.query(api.queries.chefs.getById, { chefId: meal.chefId as any });
          
          // Get reviews for rating
          const allReviews = await convex.query(api.queries.reviews.getAll);
          const reviews = allReviews.filter((r: any) => r.mealId === dishId || r.meal_id === dishId);
          const avgRating = reviews.length > 0
            ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
            : meal.rating || 0;

          dishMap.set(dishId, {
            dish_id: dishId,
            name: item.name || meal.name || 'Unknown Dish',
            price: item.price || meal.price || 0,
            image_url: meal.images?.[0] ? `/api/files/${meal.images[0]}` : undefined,
            kitchen_name: chef?.name || 'Unknown Kitchen',
            kitchen_id: meal.chefId,
            last_ordered_at: order._creationTime || order.createdAt || Date.now(),
            order_count: 1,
            rating: avgRating,
          });
        } else {
          // Update existing dish entry
          const existing = dishMap.get(dishId)!;
          existing.order_count += 1;
          const orderTime = order._creationTime || order.createdAt || Date.now();
          if (orderTime > existing.last_ordered_at) {
            existing.last_ordered_at = orderTime;
          }
        }
      }
    }

    // Convert to array and sort by last_ordered_at (most recent first)
    const dishes = Array.from(dishMap.values())
      .sort((a, b) => b.last_ordered_at - a.last_ordered_at)
      .slice(0, limit)
      .map(dish => ({
        dish_id: dish.dish_id,
        name: dish.name,
        price: dish.price,
        image_url: dish.image_url,
        kitchen_name: dish.kitchen_name,
        kitchen_id: dish.kitchen_id,
        last_ordered_at: dish.last_ordered_at,
        order_count: dish.order_count,
        has_bussin_badge: (dish.rating || 0) >= 4.5,
      }));

    return ResponseFactory.success({
      dishes,
      total: dishMap.size,
      limit,
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch recent dishes.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

