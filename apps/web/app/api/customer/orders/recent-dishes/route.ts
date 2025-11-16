import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
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
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    // Get customer's past orders
    const orders = await convex.query(api.queries.orders.listByCustomer, {
      customer_id: userId,
      status: 'past',
      order_type: 'all',
      sessionToken: sessionToken || undefined
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

    // Collect all unique dish IDs first
    const dishIdSet = new Set<string>();
    const dishOrderMap = new Map<string, Array<{ order: any; item: any }>>();
    
    for (const order of orders) {
      if (!order.order_items || !Array.isArray(order.order_items)) continue;

      for (const item of order.order_items) {
        const dishId = item.dish_id || item.dishId;
        if (!dishId) continue;
        
        dishIdSet.add(dishId);
        
        if (!dishOrderMap.has(dishId)) {
          dishOrderMap.set(dishId, []);
        }
        dishOrderMap.get(dishId)!.push({ order, item });
      }
    }
    
    // Get all dish details in one batch query
    const dishIds = Array.from(dishIdSet) as Id<'meals'>[];
    const dishesWithDetails = dishIds.length > 0
      ? await convex.query(api.queries.meals.getDishesWithDetails, {
        dishIds,
        userId,
        sessionToken: sessionToken || undefined
      })
      : [];
    
    // Create a map of dish details for quick lookup
    const dishDetailsMap = new Map<string, any>();
    for (const dish of dishesWithDetails) {
      dishDetailsMap.set(dish._id, dish);
    }
    
    // Process orders and build dish map with order counts
    for (const [dishId, orderItems] of dishOrderMap.entries()) {
      const dishDetails = dishDetailsMap.get(dishId);
      if (!dishDetails) continue;
      
      const firstItem = orderItems[0];
      const lastOrder = orderItems.reduce((latest, current) => {
        const currentTime = current.order._creationTime || current.order.createdAt || Date.now();
        const latestTime = latest.order._creationTime || latest.order.createdAt || Date.now();
        return currentTime > latestTime ? current : latest;
      }, firstItem);
      
      dishMap.set(dishId, {
        dish_id: dishId,
        name: firstItem.item.name || dishDetails.name || 'Unknown Dish',
        price: firstItem.item.price || dishDetails.price || 0,
        image_url: dishDetails.images?.[0] ? `/api/files/${dishDetails.images[0]}` : undefined,
        kitchen_name: dishDetails.chef?.name || 'Unknown Kitchen',
        kitchen_id: dishDetails.chefId,
        last_ordered_at: lastOrder.order._creationTime || lastOrder.order.createdAt || Date.now(),
        last_order_id: lastOrder.order._id || lastOrder.order.id || null,
        order_count: orderItems.length,
        rating: dishDetails.averageRating || 0,
      });
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
        last_order_id: dish.last_order_id,
        order_count: dish.order_count,
        has_bussin_badge: (dish.rating || 0) >= 4.5,
      }));

    return ResponseFactory.success({
      dishes,
      total: dishMap.size,
      limit,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch recent dishes.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

