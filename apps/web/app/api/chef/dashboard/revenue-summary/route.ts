import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /chef/dashboard/revenue-summary:
 *   post:
 *     summary: Get Chef Revenue Summary
 *     description: Retrieve revenue summary and order statistics for the authenticated chef's dashboard. This endpoint provides financial insights including total revenue, order count, and performance metrics for chef business analytics.
 *     tags: [Chef, Dashboard, Revenue]
 *     responses:
 *       200:
 *         description: Revenue summary retrieved successfully
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
 *                     total_revenue:
 *                       type: number
 *                       description: Total revenue earned by the chef
 *                       example: 12500.50
 *                     order_count:
 *                       type: integer
 *                       description: Total number of orders completed
 *                       example: 245
 *                     average_order_value:
 *                       type: number
 *                       nullable: true
 *                       description: Average value per order
 *                       example: 51.02
 *                     revenue_breakdown:
 *                       type: object
 *                       nullable: true
 *                       description: Revenue breakdown by period
 *                       properties:
 *                         today:
 *                           type: number
 *                           example: 125.50
 *                         this_week:
 *                           type: number
 *                           example: 850.25
 *                         this_month:
 *                           type: number
 *                           example: 3200.75
 *                         this_year:
 *                           type: number
 *                           example: 12500.50
 *                     order_stats:
 *                       type: object
 *                       nullable: true
 *                       description: Order statistics
 *                       properties:
 *                         completed:
 *                           type: integer
 *                           example: 240
 *                         cancelled:
 *                           type: integer
 *                           example: 5
 *                         pending:
 *                           type: integer
 *                           example: 0
 *                         completion_rate:
 *                           type: number
 *                           example: 98.0
 *                     top_dishes:
 *                       type: array
 *                       nullable: true
 *                       description: Top performing dishes
 *                       items:
 *                         type: object
 *                         properties:
 *                           dish_id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           dish_name:
 *                             type: string
 *                             example: "Spaghetti Carbonara"
 *                           order_count:
 *                             type: integer
 *                             example: 45
 *                           revenue:
 *                             type: number
 *                             example: 1125.00
 *                     trends:
 *                       type: object
 *                       nullable: true
 *                       description: Revenue trends
 *                       properties:
 *                         weekly_growth:
 *                           type: number
 *                           example: 12.5
 *                         monthly_growth:
 *                           type: number
 *                           example: 8.3
 *                         peak_hours:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["19:00", "20:00", "21:00"]
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Summary generation timestamp
 *                       example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - chef role required
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

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);
    const convex = getConvexClient();
    const orders = await convex.query(api.queries.orders.listByChef, { chef_id: userId });
    const total_revenue = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
    const order_count = orders.length;
    return ResponseFactory.success({ total_revenue, order_count });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 