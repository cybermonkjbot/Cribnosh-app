import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface CompleteOrderRequest {
  orderId: string;
  completionNotes?: string;
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/complete:
 *   post:
 *     summary: Complete Order
 *     description: Mark an order as completed (admin/staff/chef only)
 *     tags: [Orders, Order Management]
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
 *                 description: Order ID to mark as completed
 *                 example: "j1234567890abcdef"
 *               completionNotes:
 *                 type: string
 *                 nullable: true
 *                 description: Notes about order completion
 *                 example: "Order delivered successfully, customer satisfied"
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional completion metadata
 *                 example: {"deliveryTime": "18:30", "customerRating": 5}
 *     responses:
 *       200:
 *         description: Order completed successfully
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
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Order completion timestamp
 *                       example: "2024-01-15T18:30:00.000Z"
 *                     completedBy:
 *                       type: string
 *                       description: User who completed the order
 *                       example: "j1234567890abcdef"
 *                     completionNotes:
 *                       type: string
 *                       nullable: true
 *                       example: "Order delivered successfully, customer satisfied"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields or invalid order status
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
 *         description: Forbidden - insufficient permissions
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
async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    // Check if user has permission to mark orders as completed
    if (!['admin', 'staff', 'chef'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: CompleteOrderRequest = await request.json();
    const { orderId, completionNotes, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Check if order can be marked as completed
    if (order.order_status !== 'delivered') {
      return ResponseFactory.validationError('Order cannot be marked as completed. Current status: ${order.order_status}. Order must be delivered first.');
    }

    // Mark order as completed
    const completedOrder = await convex.mutation(api.mutations.orders.markOrderCompleted, {
      orderId: order._id,
      completedBy: payload.user_id,
      completionNotes: completionNotes || 'Order completed',
      metadata: {
        completedByRole: payload.role,
        ...metadata
      }
    });

    console.log(`Order ${orderId} marked as completed by ${payload.user_id} (${payload.role})`);

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error completing order:', error);
    return ResponseFactory.internalError('Failed to complete order');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 