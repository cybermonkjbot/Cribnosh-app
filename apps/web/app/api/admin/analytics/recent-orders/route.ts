import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/analytics/recent-orders:
 *   get:
 *     summary: Get Recent Orders Analytics
 *     description: Retrieve the 20 most recent orders for admin analytics dashboard
 *     tags: [Admin, Analytics, Orders]
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
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
 *                     recentOrders:
 *                       type: array
 *                       description: Array of recent orders (max 20)
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Order ID
 *                             example: "j1234567890abcdef"
 *                           order_id:
 *                             type: string
 *                             description: Public order ID
 *                             example: "ORD-12345"
 *                           customer_id:
 *                             type: string
 *                             description: Customer ID
 *                             example: "j1234567890abcdef"
 *                           chef_id:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           status:
 *                             type: string
 *                             enum: [pending, confirmed, preparing, ready, delivered, completed, cancelled]
 *                             description: Order status
 *                             example: "preparing"
 *                           total_amount:
 *                             type: number
 *                             description: Total order amount
 *                             example: 25.99
 *                           payment_status:
 *                             type: string
 *                             enum: [pending, processing, completed, failed, refunded]
 *                             description: Payment status
 *                             example: "completed"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Order creation timestamp
 *                             example: "2024-01-15T10:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Last update timestamp
 *                             example: "2024-01-15T15:30:00.000Z"
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
    // Use correct query for orders
    const orders = await convex.query(api.queries.custom_orders.getAllOrders, {});
    // Sort by createdAt desc and limit to 20
    const recentOrders = orders
      .sort((a: { createdAt?: number }, b: { createdAt?: number }) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 20);
    return ResponseFactory.success({ recentOrders });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 