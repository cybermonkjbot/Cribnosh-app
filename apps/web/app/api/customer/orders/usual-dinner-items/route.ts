import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/orders/usual-dinner-items:
 *   get:
 *     summary: Get Usual Dinner Items
 *     description: Get frequently ordered dinner items with full details (filtered by dinner time: 5 PM - 10 PM)
 *     tags: [Customer, Orders]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 6
 *         description: Number of items to return
 *         example: 6
 *       - in: query
 *         name: time_range
 *         schema:
 *           type: string
 *           enum: [week, month, all]
 *           default: all
 *         description: Time range to filter orders
 *         example: all
 *     responses:
 *       200:
 *         description: Usual dinner items retrieved successfully
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
 *                     items:
 *                       type: array
 *                       description: Array of frequently ordered dinner items
 *                       items:
 *                         type: object
 *                         properties:
 *                           dish_id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             example: "Chicken Tikka Masala"
 *                           price:
 *                             type: number
 *                             description: Price in pence
 *                             example: 1599
 *                           image_url:
 *                             type: string
 *                             nullable: true
 *                             example: "https://example.com/image.jpg"
 *                           kitchen_name:
 *                             type: string
 *                             example: "Curry House"
 *                           kitchen_id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           order_count:
 *                             type: integer
 *                             example: 5
 *                           last_ordered_at:
 *                             type: number
 *                             example: 1640995200000
 *                           avg_rating:
 *                             type: number
 *                             nullable: true
 *                             example: 4.5
 *                     total:
 *                       type: integer
 *                       example: 12
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only customers can access
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '') || 6;
    const timeRange = searchParams.get('time_range') || 'all';

    // Calculate time range filter
    const now = Date.now();
    let timeRangeStart = 0;
    if (timeRange === 'week') {
      timeRangeStart = now - (7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      timeRangeStart = now - (30 * 24 * 60 * 60 * 1000);
    }

    // Get all orders for the user
    const allOrders = await convex.query(api.queries.orders.listByCustomer, {
      customer_id: userId,
      status: 'all',
      order_type: 'all',
    });

    // Filter orders by time range if specified
    let filteredOrders = allOrders;
    if (timeRange !== 'all') {
      filteredOrders = allOrders.filter((order: { order_date?: number; createdAt?: number; _creationTime?: number }) => {
        const orderDate = order.order_date || order.createdAt || order._creationTime;
        return orderDate && orderDate >= timeRangeStart;
      });
    }

    // Aggregate dinner items (orders between 5 PM - 10 PM, delivered status)
    const dinnerItemsMap = new Map<string, {
      dish_id: string;
      name: string;
      price: number;
      image_url?: string;
      kitchen_name: string;
      kitchen_id: string;
      order_count: number;
      last_ordered_at: number;
      ratings: number[];
    }>();

    for (const order of filteredOrders) {
      // Check if order is delivered
      if (order.order_status !== 'delivered') continue;

      // Get order date
      const orderDate = order.order_date || order.createdAt || order._creationTime;
      const date = new Date(orderDate);
      const hour = date.getHours();

      // Check if it's dinner time (5 PM - 10 PM)
      if (hour < 17 || hour >= 22) continue;

      // Process order items
      if (order.order_items && Array.isArray(order.order_items)) {
        for (const item of order.order_items) {
          const dishId = item.dish_id || item.mealId || item.meal_id;
          if (!dishId) continue;

          const existing = dinnerItemsMap.get(dishId);
          if (existing) {
            existing.order_count += item.quantity || 1;
            if (orderDate > existing.last_ordered_at) {
              existing.last_ordered_at = orderDate;
            }
          } else {
            // Get meal details
            let meal: any = null;
            try {
              meal = await convex.query((api as any).queries.meals.getById, { mealId: dishId as any });
            } catch {
              // Meal not found, skip
              continue;
            }

            if (!meal) continue;

            // Get chef/kitchen details
            let chef: any = null;
            if (meal.chefId) {
              try {
                chef = await convex.query((api as any).queries.chefs.getById, { chefId: meal.chefId as any });
              } catch {
                // Chef not found
              }
            }

            // Get reviews for average rating
            const allReviews = await convex.query((api as any).queries.reviews.getAll);
            const mealReviews = allReviews.filter((r: any) => 
              r.mealId === dishId || r.meal_id === dishId
            );
            const ratings = mealReviews.map((r: any) => r.rating || 0).filter((r: number) => r > 0);

            dinnerItemsMap.set(dishId, {
              dish_id: dishId,
              name: item.name || meal.name || 'Unknown Dish',
              price: item.price || meal.price || 0,
              image_url: meal.images?.[0] ? `/api/files/${meal.images[0]}` : undefined,
              kitchen_name: chef?.name || order.chef_name || 'Unknown Kitchen',
              kitchen_id: meal.chefId || order.chef_id || '',
              order_count: item.quantity || 1,
              last_ordered_at: orderDate,
              ratings,
            });
          }
        }
      }
    }

    // Convert to array and calculate average ratings
    const items = Array.from(dinnerItemsMap.values()).map(item => ({
      ...item,
      avg_rating: item.ratings.length > 0
        ? item.ratings.reduce((sum, r) => sum + r, 0) / item.ratings.length
        : undefined,
      ratings: undefined, // Remove ratings array from response
    }));

    // Sort by order count descending, then by last ordered date
    items.sort((a, b) => {
      if (b.order_count !== a.order_count) {
        return b.order_count - a.order_count;
      }
      return b.last_ordered_at - a.last_ordered_at;
    });

    // Limit results
    const limitedItems = items.slice(0, limit);

    return ResponseFactory.success({
      items: limitedItems,
      total: items.length,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch usual dinner items.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

