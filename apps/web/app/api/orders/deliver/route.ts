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
 *       - bearerAuth: []
 */
async function handlePOST(request: NextRequest) {
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

    // Check if user has permission to mark orders as delivered
    if (!payload.roles?.some(role => ['admin', 'staff', 'chef'].includes(role))) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: DeliverOrderRequest = await request.json();
    const { orderId, deliveryNotes, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClient();

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
      deliveredBy: payload.user_id || '',
      deliveryNotes: deliveryNotes || 'Order delivered',
      metadata: {
        deliveredByRole: payload.roles?.[0] || 'unknown',
        ...metadata
      }
    });

    const refundEligibleUntil = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();

    console.log(`Order ${orderId} marked as delivered by ${payload.user_id} (${payload.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({});
  } catch (error: unknown) {
    console.error('Error delivering order:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to deliver order'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 