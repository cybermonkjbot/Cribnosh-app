import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /admin/analytics/revenue-chart:
 *   get:
 *     summary: Get Revenue Chart Data
 *     description: Retrieve revenue data grouped by date for admin analytics dashboard
 *     tags: [Admin, Analytics, Revenue]
 *     parameters:
 *       - in: query
 *         name: range
 *         required: false
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Time range for grouping revenue data
 *         example: "day"
 *     responses:
 *       200:
 *         description: Revenue chart data retrieved successfully
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
 *                     revenueChart:
 *                       type: array
 *                       description: Array of revenue data points
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             description: Date in ISO format (YYYY-MM-DD for day, YYYY-MM-DD for week, YYYY-MM for month)
 *                             example: "2024-01-15"
 *                           revenue:
 *                             type: number
 *                             description: Total revenue for the date period
 *                             example: 1250.75
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
function groupByDate<T extends { [key: string]: unknown }>(items: T[], field: string, range: 'day' | 'week' | 'month') {
  const result: Record<string, number> = {};
  items.forEach(item => {
    const fieldValue = item[field];
    if (!fieldValue) return;
    const dateValue = typeof fieldValue === 'string' || typeof fieldValue === 'number' ? new Date(fieldValue) : null;
    if (!dateValue || isNaN(dateValue.getTime())) return;
    let key = '';
    if (range === 'day') key = dateValue.toISOString().slice(0, 10);
    else if (range === 'week') {
      const firstDay = new Date(dateValue);
      firstDay.setDate(dateValue.getDate() - dateValue.getDay());
      key = firstDay.toISOString().slice(0, 10);
    } else if (range === 'month') key = dateValue.toISOString().slice(0, 7);
    const totalAmount = typeof item.total_amount === 'number' ? item.total_amount : 0;
    result[key] = (result[key] || 0) + totalAmount;
  });
  return result;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    
    const convex = getConvexClient();
    // Replace api.orders with api.queries.custom_orders.getAllOrders
    const orders = await convex.query(api.queries.custom_orders.getAllOrders, {});
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as 'day' | 'week' | 'month') || 'day';
    const grouped = groupByDate(orders, 'createdAt', range);
    const revenueChart = Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
    return ResponseFactory.success({ revenueChart });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch revenue chart.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 