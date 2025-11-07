import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface ReadyOrderRequest {
  orderId: string;
  readyNotes?: string;
  packagingNotes?: string;
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/ready:
 *   post:
 *     summary: Mark Order as Ready
 *     description: Mark an order as ready for pickup/delivery (admin, staff, chef only)
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
 *                 description: Order ID to mark as ready
 *                 example: "ORD-12345"
 *               readyNotes:
 *                 type: string
 *                 description: Notes about order readiness
 *                 example: "Order is ready for pickup, all items prepared"
 *               packagingNotes:
 *                 type: string
 *                 description: Packaging instructions or notes
 *                 example: "Fragile items marked, hot items in insulated bag"
 *               metadata:
 *                 type: object
 *                 description: Additional readiness metadata
 *                 example: {"packagingType": "eco_friendly", "temperature": "hot"}
 *     responses:
 *       200:
 *         description: Order marked as ready successfully
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
 *                       example: "ready"
 *                     readyAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the order was marked as ready
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     readyNotes:
 *                       type: string
 *                       example: "Order is ready for pickup, all items prepared"
 *                     packagingNotes:
 *                       type: string
 *                       example: "Fragile items marked, hot items in insulated bag"
 *                     preparedBy:
 *                       type: string
 *                       description: ID of the person who prepared the order
 *                       example: "j1234567890abcdef"
 *                     preparedByRole:
 *                       type: string
 *                       description: Role of the person who prepared
 *                       example: "chef"
 *                     prepDuration:
 *                       type: number
 *                       description: Total preparation time in minutes
 *                       example: 25
 *                     estimatedDeliveryTime:
 *                       type: number
 *                       description: Estimated delivery time in minutes
 *                       example: 15
 *                     metadata:
 *                       type: object
 *                       example: {"packagingType": "eco_friendly"}
 *                 message:
 *                   type: string
 *                   example: "Order marked as ready successfully"
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
 *         description: Forbidden - insufficient permissions to mark orders as ready
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
 *         description: Conflict - order cannot be marked as ready in current status
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

    // Check if user has permission to mark orders as ready
    if (!payload.roles?.some(role => ['admin', 'staff', 'chef'].includes(role))) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: ReadyOrderRequest = await request.json();
    const { orderId, readyNotes, packagingNotes, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to mark this specific order as ready
    if (payload.roles?.includes('chef') && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only mark your own orders as ready.');
    }

    // Check if order can be marked as ready
    if (order.order_status !== 'preparing') {
      return ResponseFactory.validationError('Order cannot be marked as ready. Current status: ' + order.order_status);
    }

    // Mark order as ready
    const readyOrder = await convex.mutation(api.mutations.orders.markOrderReady, {
      orderId: order._id,
      readyBy: payload.user_id || '',
      readyNotes: readyNotes || order.chef_notes,
      metadata: {
        markedReadyByRole: payload.roles?.[0] || 'unknown',
        packagingNotes,
        ...metadata
      }
    });

    if (!readyOrder) {
      return ResponseFactory.internalError('Failed to mark order as ready');
    }

    console.log(`Order ${orderId} marked as ready by ${payload.user_id} (${payload.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({
      orderId: readyOrder._id,
      status: readyOrder.order_status,
      readyNotes: readyOrder.chef_notes
    });
  } catch (error: unknown) {
    console.error('Error marking order as ready:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to mark order as ready'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 