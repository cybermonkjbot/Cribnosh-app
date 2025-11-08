import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /admin/analytics/top-chefs:
 *   get:
 *     summary: Get Top Chefs Analytics
 *     description: Retrieve the top 5 chefs by order count for admin analytics dashboard
 *     tags: [Admin, Analytics, Chefs]
 *     responses:
 *       200:
 *         description: Top chefs data retrieved successfully
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
 *                     topChefs:
 *                       type: array
 *                       description: Array of top 5 chefs by order count
 *                       items:
 *                         type: object
 *                         properties:
 *                           chef_id:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             nullable: true
 *                             description: Chef name
 *                             example: "Chef Mario"
 *                           orders:
 *                             type: number
 *                             description: Total number of orders
 *                             example: 45
 *                           revenue:
 *                             type: string
 *                             description: Total revenue formatted as currency
 *                             example: "$2,450.75"
 *                           rating:
 *                             type: number
 *                             description: Average rating
 *                             example: 4.8
 *                           email:
 *                             type: string
 *                             nullable: true
 *                             description: Chef email
 *                             example: "chef.mario@example.com"
 *                           avatar:
 *                             type: string
 *                             nullable: true
 *                             description: Chef avatar URL
 *                             example: "https://example.com/avatar.jpg"
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
    
    const convex = getConvexClient();
    // Use correct queries for orders and chefs
    const chefs = await convex.query(api.queries.chefs.getAllChefLocations, {});
    const users = await convex.query(api.queries.users.getAllUsers, {});
    // Aggregate orders per chef
    const chefStats: Record<string, { orders: number; revenue: number; rating: number }> = {};
    for (const chef of chefs) {
      const orders = await convex.query(api.queries.orders.listByChef, { chef_id: chef.chefId });
      chefStats[chef.chefId] = { orders: 0, revenue: 0, rating: chef.rating || 0 };
      orders.forEach((o: any) => {
        chefStats[chef.chefId].orders += 1;
        chefStats[chef.chefId].revenue += o.total_amount || 0;
      });
    }
    const topChefs = Object.entries(chefStats)
      .map(([chefId, stats]) => {
        const chef = chefs.find((c: any) => c.chefId === chefId);
        const user = chef ? users.find((u: any) => u._id === chef.userId) : null;
        return chef && user
          ? {
              chef_id: chefId,
              name: user.name || null,
              orders: stats.orders,
              revenue: stats.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
              rating: stats.rating,
              email: user.email || null,
              avatar: user.avatar || null,
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.orders - a!.orders)
      .slice(0, 5);
    return ResponseFactory.success({ topChefs });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top chefs.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 