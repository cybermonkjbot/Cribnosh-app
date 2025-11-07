import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface PrepareOrderRequest {
  orderId: string;
  prepNotes?: string;
  updatedPrepTime?: number; // in minutes
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/prepare:
 *   post:
 *     summary: Start Order Preparation
 *     description: Mark an order as being prepared by chef/staff (admin, staff, chef only)
 *     tags: [Orders, Order Management, Preparation]
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
 *                 description: Order ID to prepare
 *                 example: "ORD-12345"
 *               prepNotes:
 *                 type: string
 *                 description: Preparation notes from chef
 *                 example: "Starting preparation, estimated 25 minutes"
 *               updatedPrepTime:
 *                 type: number
 *                 description: Updated preparation time in minutes
 *                 example: 25
 *               metadata:
 *                 type: object
 *                 description: Additional preparation metadata
 *                 example: {"kitchen": "main", "priority": "normal"}
 *     responses:
 *       200:
 *         description: Order preparation started successfully
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
 *                       example: "preparing"
 *                     prepStartedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When preparation started
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     estimatedPrepTime:
 *                       type: number
 *                       description: Estimated preparation time in minutes
 *                       example: 25
 *                     prepNotes:
 *                       type: string
 *                       example: "Starting preparation, estimated 25 minutes"
 *                     preparedBy:
 *                       type: string
 *                       description: ID of the person preparing the order
 *                       example: "j1234567890abcdef"
 *                     preparedByRole:
 *                       type: string
 *                       description: Role of the person preparing
 *                       example: "chef"
 *                     metadata:
 *                       type: object
 *                       example: {"kitchen": "main", "priority": "normal"}
 *                 message:
 *                   type: string
 *                   example: "Order preparation started successfully"
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
 *         description: Forbidden - insufficient permissions to prepare orders
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
 *         description: Conflict - order cannot be prepared in current status
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
async function handlePOST(request: NextRequest): Promise<NextResponse> {
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

    // Check if user has permission to prepare orders
    if (!payload.roles?.some(role => ['admin', 'staff', 'chef'].includes(role))) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: PrepareOrderRequest = await request.json();
    const { orderId, prepNotes, updatedPrepTime, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to prepare this specific order
    if (payload.roles?.includes('chef') && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only prepare your own orders.');
    }

    // Check if order can be prepared
    if (order.order_status !== 'confirmed') {
      return ResponseFactory.validationError('Order cannot be prepared. Current status: ' + order.order_status);
    }

    // Start preparing order
    const preparedOrder = await convex.mutation(api.mutations.orders.prepareOrder, {
      orderId: order._id,
      preparedBy: payload.user_id || '',
      prepNotes: prepNotes || order.chef_notes,
      updatedPrepTime: updatedPrepTime || order.estimated_prep_time_minutes,
      metadata: {
        preparedByRole: payload.roles?.[0] || 'unknown',
        ...metadata
      }
    });

    if (!preparedOrder) {
      return ResponseFactory.internalError('Failed to prepare order');
    }

    console.log(`Order ${orderId} preparation started by ${payload.user_id} (${payload.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({
      orderId: preparedOrder._id,
      status: preparedOrder.order_status,
      prepNotes: preparedOrder.chef_notes
    });
  } catch (error: unknown) {
    console.error('Error preparing order:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to prepare order'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 