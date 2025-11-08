import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

interface DeliverOrderRequest {
  orderId: string;
  deliveryNotes?: string;
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/deliver:
 *   post:
 *     summary: Mark Order as Delivered
 *     description: Mark an order as delivered (admin, staff, chef only)
 *     tags: [Orders, Order Management, Delivery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to mark as delivered
 *                 example: "ORD-12345"
 *               deliveryNotes:
 *                 type: string
 *                 description: Delivery notes or comments
 *                 example: "Delivered to front door, customer confirmed receipt"
 *               metadata:
 *                 type: object
 *                 description: Additional delivery metadata
 *                 example: {"deliveryMethod": "contactless", "signature": "received"}
 *     responses:
 *       200:
 *         description: Order marked as delivered successfully
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
 *                     status:
 *                       type: string
 *                       description: Updated order status
 *                       example: "delivered"
 *                     deliveredAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the order was delivered
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     deliveryNotes:
 *                       type: string
 *                       example: "Delivered to front door, customer confirmed receipt"
 *                     deliveredBy:
 *                       type: string
 *                       description: ID of the person who delivered the order
 *                       example: "j1234567890abcdef"
 *                     deliveredByRole:
 *                       type: string
 *                       description: Role of the person who delivered
 *                       example: "chef"
 *                     deliveryDuration:
 *                       type: number
 *                       description: Total delivery time in minutes
 *                       example: 15
 *                     metadata:
 *                       type: object
 *                       example: {"deliveryMethod": "contactless"}
 *                 message:
 *                   type: string
 *                   example: "Order marked as delivered successfully"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to mark orders as delivered
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
 *       409:
 *         description: Conflict - order cannot be delivered in current status
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
async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// Check if user has permission to mark orders as delivered
    if (!user.roles?.some(role => ['admin', 'staff', 'chef'].includes(role))) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: DeliverOrderRequest = await request.json();
    const { orderId, deliveryNotes, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClientFromRequest(request);

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Check if order can be marked as delivered
    const deliverableStatuses = ['confirmed', 'preparing', 'ready'];
    if (!deliverableStatuses.includes(order.order_status)) {
      return ResponseFactory.validationError('Order cannot be marked as delivered. Current status: ${order.order_status}');
    }

    // Mark order as delivered
    const deliveredOrder = await convex.mutation(api.mutations.orders.markOrderDelivered, {
      orderId: order._id,
      deliveredBy: userId || '',
      deliveryNotes: deliveryNotes || 'Order delivered',
      metadata: {
        deliveredByRole: user.roles?.[0] || 'unknown',
        ...metadata
      }
    });

    const refundEligibleUntil = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();

    logger.log(`Order ${orderId} marked as delivered by ${userId} (${user.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error delivering order:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to deliver order'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 