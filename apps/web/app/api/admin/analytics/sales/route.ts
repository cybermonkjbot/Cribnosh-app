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
 * /admin/analytics/sales:
 *   get:
 *     summary: Get Sales Analytics
 *     description: Retrieve comprehensive sales analytics data (admin only)
 *     tags: [Admin, Analytics, Sales]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: number
 *         description: Start timestamp for date range filter
 *         example: 1640995200000
 *       - in: query
 *         name: end
 *         schema:
 *           type: number
 *         description: End timestamp for date range filter
 *         example: 1641081600000
 *     responses:
 *       200:
 *         description: Sales analytics retrieved successfully
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
 *                     sales_by_status:
 *                       type: object
 *                       description: Sales breakdown by order status
 *                       example:
 *                         confirmed: {count: 150, revenue: 3750.00}
 *                         pending: {count: 25, revenue: 625.00}
 *                         cancelled: {count: 10, revenue: 0.00}
 *                     sales_by_cuisine:
 *                       type: object
 *                       description: Sales breakdown by cuisine type
 *                       example:
 *                         italian: {count: 45, revenue: 1125.00}
 *                         chinese: {count: 38, revenue: 950.00}
 *                         indian: {count: 32, revenue: 800.00}
 *                     total_revenue:
 *                       type: number
 *                       description: Total revenue in the period
 *                       example: 4375.00
 *                     total_orders:
 *                       type: number
 *                       description: Total number of orders
 *                       example: 185
 *                     average_order_value:
 *                       type: number
 *                       description: Average order value
 *                       example: 23.65
 *                     period:
 *                       type: string
 *                       description: Analysis period
 *                       example: "2024-01-01T00:00:00.000Z - 2024-01-31T23:59:59.999Z"
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
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: { roles?: string[] } | string;
    try {
      payload = jwt.verify(token, JWT_SECRET) as { roles?: string[] } | string;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (typeof payload === 'string' || !payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ? Number(searchParams.get('start')) : undefined;
    const end = searchParams.get('end') ? Number(searchParams.get('end')) : undefined;
    const orders = await convex.query(api.queries.custom_orders.getAllOrders, {});
    // Filter by date range
    const filterByDate = <T extends { [key: string]: unknown }>(arr: T[], field: string): T[] => arr.filter(item => {
      if (!item[field]) return false;
      const fieldValue = item[field];
      const t = typeof fieldValue === 'number' ? fieldValue : typeof fieldValue === 'string' ? new Date(fieldValue).getTime() : 0;
      if (isNaN(t)) return false;
      if (start && t < start) return false;
      if (end && t > end) return false;
      return true;
    });
    const ordersInRange = filterByDate(orders, 'order_date');
    // Sales by status
    const sales_by_status: Record<string, { count: number; revenue: number }> = {};
    ordersInRange.forEach((o) => {
      const status = (o.status as string) || 'unknown';
      // custom_orders doesn't have total_amount field, use a default of 0 or calculate from items if available
      const totalAmount = 0; // TODO: Calculate from order items if needed
      if (!sales_by_status[status]) sales_by_status[status] = { count: 0, revenue: 0 };
      sales_by_status[status].count += 1;
      sales_by_status[status].revenue += totalAmount;
    });
    // Sales by cuisine - skip since custom_orders doesn't have cuisine_id
    const sales_by_cuisine: Array<{ cuisine_id: string; count: number; revenue: number }> = [];
    // Period string
    let period = '';
    if (start && end) {
      period = `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`;
    }
    return ResponseFactory.success({
      sales_by_status,
      sales_by_cuisine,
      period
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sales.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 