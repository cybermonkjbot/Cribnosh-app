import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest } from 'next/server';

interface ConfirmOrderRequest {
  orderId: string;
  estimatedPrepTime?: number; // in minutes
  chefNotes?: string;
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/confirm:
 *   post:
 *     summary: Confirm Order
 *     description: Confirm a pending order and set preparation details (admin, staff, or chef)
 *     tags: [Orders]
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
 *                 description: ID of the order to confirm
 *                 example: "j1234567890abcdef"
 *               estimatedPrepTime:
 *                 type: number
 *                 nullable: true
 *                 description: Estimated preparation time in minutes
 *                 example: 30
 *               chefNotes:
 *                 type: string
 *                 nullable: true
 *                 description: Notes from the chef about the order
 *                 example: "Order will be ready in 25 minutes"
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional metadata for the confirmation
 *                 example: {"kitchen": "main", "priority": "high"}
 *     responses:
 *       200:
 *         description: Order confirmed successfully
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
 *                       description: Confirmed order ID
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       description: Updated order status
 *                       enum: [confirmed, preparing, ready, delivered, cancelled]
 *                       example: "confirmed"
 *                     estimatedReadyTime:
 *                       type: number
 *                       description: Estimated preparation time in minutes
 *                       example: 30
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing orderId or order cannot be confirmed
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
 *         description: Forbidden - insufficient permissions or cannot confirm this order
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
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// Check if user has permission to confirm orders
    if (!user.roles?.some(role => ['admin', 'staff', 'chef'].includes(role))) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: ConfirmOrderRequest = await request.json();
    const { orderId, estimatedPrepTime, chefNotes, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // At this point, order is guaranteed to be non-null
    const validOrder = order;

    // Verify user has permission to confirm this specific order
    if (user.roles?.includes('chef') && validOrder.chef_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only confirm your own orders.');
    }

    // Check if order can be confirmed
    if (validOrder.order_status !== 'pending') {
      return ResponseFactory.validationError('Order cannot be confirmed. Current status: ' + validOrder.order_status);
    }

    // Confirm order
    const confirmedOrder = await convex.mutation(api.mutations.orders.confirmOrder, {
      orderId: validOrder._id,
      confirmedBy: userId || '',
      estimatedReadyTime: estimatedPrepTime || validOrder.estimated_prep_time_minutes,
      notes: chefNotes || validOrder.chef_notes,
      metadata: {
        confirmedByRole: user.roles?.[0] || 'unknown',
        ...metadata
      }
    });

    if (!confirmedOrder) {
      return ResponseFactory.internalError('Failed to confirm order');
    }

    console.log(`Order ${orderId} confirmed by ${userId} (${user.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({
      orderId: confirmedOrder._id,
      status: confirmedOrder.order_status,
      estimatedReadyTime: confirmedOrder.estimated_prep_time_minutes
    });
  } catch (error: unknown) {
    console.error('Error confirming order:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to confirm order'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 