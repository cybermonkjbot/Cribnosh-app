import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/analytics/user-behavior:
 *   get:
 *     summary: Get User Behavior Analytics
 *     description: Aggregate user behavior data needed for hidden sections (total orders, days active, usual dinner items, colleague connections, play to win history)
 *     tags: [Customer, Analytics]
 *     responses:
 *       200:
 *         description: User behavior analytics retrieved successfully
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
 *                     totalOrders:
 *                       type: integer
 *                       description: Total number of orders placed
 *                       example: 15
 *                     daysActive:
 *                       type: integer
 *                       description: Days since first order or account creation
 *                       example: 45
 *                     usualDinnerItems:
 *                       type: array
 *                       description: Frequently ordered dinner items
 *                       items:
 *                         type: object
 *                         properties:
 *                           dish_id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           dish_name:
 *                             type: string
 *                             example: "Chicken Tikka Masala"
 *                           order_count:
 *                             type: integer
 *                             example: 5
 *                           last_ordered_at:
 *                             type: number
 *                             example: 1640995200000
 *                           kitchen_name:
 *                             type: string
 *                             example: "Curry House"
 *                           image_url:
 *                             type: string
 *                             nullable: true
 *                             example: "https://example.com/image.jpg"
 *                     colleagueConnections:
 *                       type: integer
 *                       description: Number of mutual follows (colleagues)
 *                       example: 8
 *                     playToWinHistory:
 *                       type: object
 *                       properties:
 *                         gamesPlayed:
 *                           type: integer
 *                           example: 3
 *                         gamesWon:
 *                           type: integer
 *                           example: 1
 *                         lastPlayed:
 *                           type: number
 *                           nullable: true
 *                           example: 1640995200000
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

    const convex = getConvexClient();

    // Get all orders for the user
    const allOrders = await convex.query((api as any).queries.orders.listByCustomer, {
      customer_id: userId,
      status: 'all',
      order_type: 'all',
    });

    // Calculate totalOrders
    const totalOrders = allOrders.length;

    // Calculate daysActive
    let daysActive = 0;
    if (allOrders.length > 0) {
      // Get first order date
      const firstOrderDate = Math.min(...allOrders.map((o: any) => o.order_date || o.createdAt || o._creationTime));
      const now = Date.now();
      daysActive = Math.floor((now - firstOrderDate) / (1000 * 60 * 60 * 24));
    } else {
      // If no orders, use account creation date
      const user = await convex.query((api as any).queries.users.getById, { userId });
      if (user) {
        const accountCreationDate = user._creationTime;
        const now = Date.now();
        daysActive = Math.floor((now - accountCreationDate) / (1000 * 60 * 60 * 24));
      }
    }

    // Get usual dinner items (orders between 5 PM - 10 PM)
    const dinnerItemsMap = new Map<string, {
      dish_id: string;
      dish_name: string;
      order_count: number;
      last_ordered_at: number;
      kitchen_name: string;
      image_url?: string;
    }>();

    for (const order of allOrders) {
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
          }

          // Get chef/kitchen details
          let chef: any = null;
          if (meal?.chefId) {
            try {
              chef = await convex.query((api as any).queries.chefs.getById, { chefId: meal.chefId as any });
            } catch {
              // Chef not found
            }
          }

            dinnerItemsMap.set(dishId, {
              dish_id: dishId,
              dish_name: item.name || meal?.name || 'Unknown Dish',
              order_count: item.quantity || 1,
              last_ordered_at: orderDate,
              kitchen_name: chef?.name || order.chef_name || 'Unknown Kitchen',
              image_url: meal?.images?.[0] ? `/api/files/${meal.images[0]}` : undefined,
            });
          }
        }
      }
    }

    // Sort by order count and limit to top 6
    const usualDinnerItems = Array.from(dinnerItemsMap.values())
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 6);

    // Get colleague connections (mutual follows)
    let colleagueConnections = 0;
    try {
      const following = await convex.query((api as any).queries.userFollows.getUserFollowing, {
        userId: userId as any,
        limit: 1000, // Get all following
      });

      // Count mutual follows (where isFollowingBack is true)
      if (following && following.following) {
        for (const follow of following.following) {
          if (follow.isFollowingBack) {
            colleagueConnections++;
          }
        }
      }
    } catch {
      // If query fails, colleagueConnections remains 0
    }

    // Get play to win history from group orders
    let allGroupOrders: any[] = [];
    try {
      allGroupOrders = await convex.query((api as any).queries.groupOrders.getByStatus, {
        status: 'delivered', // Only completed games
        user_id: userId as any,
      });
    } catch {
      // If query fails, use empty array
    }

    // Also check active group orders where user is participant
    let activeGroupOrders: any[] = [];
    try {
      activeGroupOrders = await convex.query((api as any).queries.groupOrders.getActiveByUser, {
        user_id: userId as any,
      });
    } catch {
      // If query fails, use empty array
    }

    const allParticipatedOrders = [...allGroupOrders, ...activeGroupOrders];

    // Count games played
    const gamesPlayed = allParticipatedOrders.length;

    // Count games won (assuming winner is the participant with lowest contribution or first participant)
    // For now, we'll use a simple heuristic: if user is creator, they "won"
    let gamesWon = 0;
    let lastPlayed: number | undefined = undefined;

    for (const groupOrder of allParticipatedOrders) {
      // Check if user is creator (simplified win condition)
      if (groupOrder.created_by === userId) {
        gamesWon++;
      }

      // Track last played timestamp
      const orderTime = groupOrder.createdAt || groupOrder._creationTime;
      if (!lastPlayed || orderTime > lastPlayed) {
        lastPlayed = orderTime;
      }
    }

    return ResponseFactory.success({
      totalOrders,
      daysActive,
      usualDinnerItems,
      colleagueConnections,
      playToWinHistory: {
        gamesPlayed,
        gamesWon,
        lastPlayed: lastPlayed || undefined,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch user behavior analytics.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

