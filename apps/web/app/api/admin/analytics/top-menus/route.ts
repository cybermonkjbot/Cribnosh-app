import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/analytics/top-menus:
 *   get:
 *     summary: Get Top Menus Analytics
 *     description: Retrieve the top 5 menu items by order count for admin analytics dashboard
 *     tags: [Admin, Analytics, Menus]
 *     responses:
 *       200:
 *         description: Top menus data retrieved successfully
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
 *                     topMenus:
 *                       type: array
 *                       description: Array of top 5 menu items by order count
 *                       items:
 *                         type: object
 *                         properties:
 *                           menu_id:
 *                             type: string
 *                             description: Menu item ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             nullable: true
 *                             description: Menu item name
 *                             example: "Spaghetti Carbonara"
 *                           orders:
 *                             type: number
 *                             description: Total number of orders for this menu item
 *                             example: 32
 *                           revenue:
 *                             type: string
 *                             description: Total revenue formatted as currency
 *                             example: "$1,280.00"
 *                           chef:
 *                             type: string
 *                             nullable: true
 *                             description: Chef name who created the menu item
 *                             example: "Chef Mario"
 *                           chef_id:
 *                             type: string
 *                             nullable: true
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           dish_image:
 *                             type: string
 *                             nullable: true
 *                             description: Menu item image URL
 *                             example: "https://example.com/dish-image.jpg"
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
 *         description: Forbidden - only admins can access analytics
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    
    const convex = getConvexClientFromRequest(request);
    // Use correct queries for orders
    const chefs = await convex.query(api.queries.chefs.getAllChefLocations, {});
    const users = await convex.query(api.queries.users.getAllUsers, {});
    // Aggregate orders per dish across all chefs
    const dishStats: Record<string, { orders: number; revenue: number; chefId: string }> = {};
    for (const chef of chefs) {
      const orders = await convex.query(api.queries.orders.listByChef, { chef_id: chef.chefId });
      orders.forEach((o: any) => {
        if (o.order_items && Array.isArray(o.order_items)) {
          o.order_items.forEach((item: any) => {
            const dishId = String(item.dish_id || '');
            if (dishId) {
              if (!dishStats[dishId]) dishStats[dishId] = { orders: 0, revenue: 0, chefId: chef.chefId };
              dishStats[dishId].orders += item.quantity || 1;
              dishStats[dishId].revenue += item.price ? item.price * (item.quantity || 1) : 0;
              dishStats[dishId].chefId = chef.chefId;
            }
          });
        }
      });
    }
    const topMenus = Object.entries(dishStats)
      .map(([menuId, stats]) => {
        const chef = chefs.find((c: any) => c.chefId === stats.chefId);
        const user = chef ? users.find((u: any) => u._id === chef.userId) : null;
        return chef && user
          ? {
              menu_id: menuId,
              name: null, // No dish name available
              orders: stats.orders,
              revenue: stats.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
              chef: user.name || null,
              chef_id: chef.chefId || null,
              dish_image: null, // No dish image available
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.orders - a!.orders)
      .slice(0, 5);
    return ResponseFactory.success({ topMenus });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top menus.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 