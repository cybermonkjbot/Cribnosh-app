import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /orders/{order_id}/history:
 *   get:
 *     summary: Get Order History
 *     description: Retrieve the complete history and timeline of an order
 *     tags: [Orders, Order Management, History]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "ORD-12345"
 *     responses:
 *       200:
 *         description: Order history retrieved successfully
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
 *                     orderId:
 *                       type: string
 *                       example: "ORD-12345"
 *                     history:
 *                       type: array
 *                       description: Order history timeline
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             description: When the event occurred
 *                             example: "2024-01-15T10:00:00.000Z"
 *                           status:
 *                             type: string
 *                             description: Order status at this point
 *                             example: "confirmed"
 *                           event:
 *                             type: string
 *                             description: Event description
 *                             example: "Order confirmed by chef"
 *                           actor:
 *                             type: string
 *                             description: Who performed the action
 *                             example: "chef"
 *                           actorId:
 *                             type: string
 *                             description: ID of the actor
 *                             example: "j1234567890abcdef"
 *                           metadata:
 *                             type: object
 *                             description: Additional event metadata
 *                             example: {"prepTime": 30, "notes": "Customer prefers extra spicy"}
 *                           location:
 *                             type: object
 *                             description: Location information if applicable
 *                             properties:
 *                               latitude:
 *                                 type: number
 *                                 example: 51.5074
 *                               longitude:
 *                                 type: number
 *                                 example: -0.1276
 *                               address:
 *                                 type: string
 *                                 example: "123 Main Street, London"
 *                     currentStatus:
 *                       type: string
 *                       description: Current order status
 *                       example: "preparing"
 *                     totalDuration:
 *                       type: number
 *                       description: Total time elapsed in minutes
 *                       example: 45
 *                 message:
 *                   type: string
 *                   example: "Order history retrieved successfully"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to view this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
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
    // Verify authentication
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

    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/history/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const convex = getConvexClient();

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to view this specific order
    if (payload.roles?.includes('customer') && order.customer_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }
    if (payload.roles?.includes('chef') && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }

    // Get order history
    const history = await convex.query(api.queries.orders.getOrderHistory, { orderId: order_id });

    // Format history entries
    const formattedHistory = history.map((entry: { _id: string; action?: string; description?: string; performed_by?: string; performed_at?: number; metadata?: Record<string, unknown>; reason?: string }) => ({
      id: entry._id,
      action: entry.action,
      description: entry.description,
      performedBy: entry.performed_by,
      performedAt: new Date(entry.performed_at).toISOString(),
      metadata: entry.metadata || {},
      reason: entry.reason
    }));

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      history: formattedHistory,
      totalEntries: formattedHistory.length
    });

  } catch (error: unknown) {
    console.error('Order history error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get order history.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 