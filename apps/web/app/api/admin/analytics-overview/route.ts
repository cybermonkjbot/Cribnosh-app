import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import type { JWTPayload } from '@/types/convex-contexts';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function groupByDate<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  range: 'day' | 'week' | 'month'
): Record<string, number> {
  const result: Record<string, number> = {};
  items.forEach(item => {
    const fieldValue = item[field];
    if (!fieldValue) return;
    const dateValue = typeof fieldValue === 'number' ? new Date(fieldValue) : 
                     typeof fieldValue === 'string' ? new Date(fieldValue) : 
                     fieldValue instanceof Date ? fieldValue : new Date(String(fieldValue));
    const date = dateValue;
    let key = '';
    if (range === 'day') key = date.toISOString().slice(0, 10);
    else if (range === 'week') {
      const firstDay = new Date(date);
      firstDay.setDate(date.getDate() - date.getDay());
      key = firstDay.toISOString().slice(0, 10);
    } else if (range === 'month') key = date.toISOString().slice(0, 7);
    result[key] = (result[key] || 0) + 1;
  });
  return result;
}

/**
 * @swagger
 * /admin/analytics-overview:
 *   get:
 *     summary: Get Analytics Overview
 *     description: Get comprehensive analytics overview for admin dashboard with revenue, orders, users, and trends
 *     tags: [Admin, Analytics]
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
 *         description: Analytics overview retrieved successfully
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
 *                       description: Total revenue in the specified period
 *                       example: 45678.50
 *                     total_orders:
 *                       type: number
 *                       description: Total number of orders in the period
 *                       example: 1250
 *                     average_order_value:
 *                       type: number
 *                       description: Average order value
 *                       example: 36.54
 *                     total_users:
 *                       type: number
 *                       description: Total number of users in the period
 *                       example: 850
 *                     revenue_trend:
 *                       type: number
 *                       description: Revenue trend percentage change from previous period
 *                       example: 15.5
 *                     orders_trend:
 *                       type: number
 *                       description: Orders trend percentage change from previous period
 *                       example: 8.2
 *                     aov_trend:
 *                       type: number
 *                       description: Average order value trend percentage change
 *                       example: 6.7
 *                     users_trend:
 *                       type: number
 *                       description: Users trend percentage change from previous period
 *                       example: 12.3
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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'admin' && !payload.roles?.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access analytics.');
    }
    const convex = getConvexClient();
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ? Number(searchParams.get('start')) : undefined;
    const end = searchParams.get('end') ? Number(searchParams.get('end')) : undefined;
    // Fetch data
    const users = await convex.query(api.queries.users.getAllUsers, {});
    type Order = { createdAt?: number | string; total_amount?: number; [key: string]: unknown };
    let orders: Order[] = [];
    try {
      orders = await convex.query(api.queries.custom_orders.getAllOrders, {}) as Order[];
    } catch { orders = []; }
    // Filter by date range helper
    const filterByDateRange = <T extends { [key: string]: unknown }>(
      arr: T[],
      field: string,
      rangeStart?: number,
      rangeEnd?: number
    ): T[] => {
      return arr.filter(item => {
        const fieldValue = item[field];
        if (!fieldValue) return false;
        const t = typeof fieldValue === 'number' ? fieldValue : 
                 typeof fieldValue === 'string' ? new Date(fieldValue).getTime() :
                 fieldValue instanceof Date ? fieldValue.getTime() :
                 new Date(String(fieldValue)).getTime();
        if (isNaN(t)) return false;
        if (rangeStart !== undefined && t < rangeStart) return false;
        if (rangeEnd !== undefined && t >= rangeEnd) return false;
        return true;
      });
    };
    const usersInRange = filterByDateRange(users, '_creationTime', start, end);
    const ordersInRange = filterByDateRange(orders, 'createdAt', start, end);
    // Calculate values
    const total_revenue = ordersInRange.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const total_orders = ordersInRange.length;
    const average_order_value = total_orders > 0 ? total_revenue / total_orders : 0;
    const total_users = usersInRange.length;
    // Trends: compare current period to previous period
    const periodLength = (end && start) ? end - start : 0;
    const prevStart = start && end ? start - periodLength : undefined;
    const prevEnd = start;
    // Filter full arrays directly by previous period range (not chaining filters)
    const usersPrev = prevStart !== undefined && prevEnd !== undefined 
      ? filterByDateRange(users, '_creationTime', prevStart, prevEnd) 
      : [];
    const ordersPrev = prevStart !== undefined && prevEnd !== undefined 
      ? filterByDateRange(orders, 'createdAt', prevStart, prevEnd) 
      : [];
    const revenuePrev = ordersPrev.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const aovPrev = ordersPrev.length > 0 ? revenuePrev / ordersPrev.length : 0;
    // Calculate trends as percentage change
    function trend(current: number, prev: number) {
      if (prev === 0) return current === 0 ? 0 : 100;
      return ((current - prev) / prev) * 100;
    }
    const revenue_trend = trend(total_revenue, revenuePrev);
    const orders_trend = trend(total_orders, ordersPrev.length);
    const aov_trend = trend(average_order_value, aovPrev);
    const users_trend = trend(total_users, usersPrev.length);
    // Audit log
    const userId = payload.user_id || payload.userId;
    if (userId) {
      await convex.mutation(api.mutations.admin.insertAdminLog, {
        action: 'view_analytics_overview',
        details: { start, end },
        adminId: userId as unknown as import('@/convex/_generated/dataModel').Id<"users">,
      });
    }
    return ResponseFactory.success({
      total_revenue,
      total_orders,
      average_order_value,
      total_users,
      revenue_trend,
      orders_trend,
      aov_trend,
      users_trend
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics.';
    return ResponseFactory.internalError(message);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 