import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { stripe } from '@/lib/stripe';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface CancelOrderRequest {
  orderId: string;
  reason: 'customer_request' | 'out_of_stock' | 'chef_unavailable' | 'delivery_issue' | 'fraudulent' | 'duplicate' | 'other';
  description?: string;
  autoRefund?: boolean; // Whether to automatically process refund
  refundAmount?: number; // Optional: partial refund amount
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/cancel:
 *   post:
 *     summary: Cancel Order
 *     description: Cancel an order with optional automatic refund processing
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - reason
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID of the order to cancel
 *                 example: "j1234567890abcdef"
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 enum: [customer_request, out_of_stock, chef_unavailable, delivery_issue, fraudulent, duplicate, other]
 *                 example: "customer_request"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Additional description for the cancellation
 *                 example: "Customer requested cancellation due to change of plans"
 *               autoRefund:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to automatically process refund if payment was made
 *                 example: true
 *               refundAmount:
 *                 type: number
 *                 nullable: true
 *                 description: Partial refund amount in smallest currency unit (optional for full refund)
 *                 example: 1599
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional metadata for the cancellation
 *                 example: {"source": "mobile_app", "priority": "urgent"}
 *     responses:
 *       200:
 *         description: Order cancelled successfully
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
 *                   description: Empty object on success
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields or order cannot be cancelled
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
 *         description: Forbidden - insufficient permissions or cannot cancel this order
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

    // Check if user has permission to cancel orders
    if (!['admin', 'staff', 'customer'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: CancelOrderRequest = await request.json();
    const { orderId, reason, description, autoRefund = true, refundAmount, metadata } = body;

    if (!orderId || !reason) {
      return ResponseFactory.validationError('Missing required fields: orderId and reason.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
    if (!cancellableStatuses.includes(order.order_status)) {
      return ResponseFactory.validationError('Order cannot be cancelled. Current status: ${order.order_status}');
    }

    // Verify user has permission to cancel this specific order
    if (payload.role === 'customer' && order.customer_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only cancel your own orders.');
    }

    // Cancel order in database first
    const cancelledOrder = await convex.mutation(api.mutations.orders.cancelOrder, {
      orderId: order._id,
      reason,
      cancelledBy: payload.user_id,
      description: description || `Order cancelled: ${reason}`,
      metadata: {
        cancelledByRole: payload.role,
        ...metadata
      }
    });

    let refundResult = null;

    // Process automatic refund if requested and payment was made
    if (autoRefund && order.payment_status === 'paid' && order.payment_id) {
      try {
        // Create refund in Stripe
        const refundData: any = {
          payment_intent: order.payment_id,
          reason: 'requested_by_customer',
          metadata: {
            orderId,
            cancelledBy: payload.user_id,
            cancelledByRole: payload.role,
            cancellationReason: reason,
            ...metadata
          }
        };

        // Add amount for partial refunds
        if (refundAmount && refundAmount > 0) {
          const orderAmount = Math.round(order.total_amount * 100); // Convert to cents
          if (refundAmount > orderAmount) {
            return ResponseFactory.validationError('Refund amount cannot exceed order amount.');
          }
          refundData.amount = refundAmount;
        }

        // Add description if provided
        if (description) {
          refundData.description = `Refund for cancelled order: ${description}`;
        }

        if (!stripe) {
  return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
}
const refund = await stripe.refunds.create(refundData);

        // Update order with refund information
        await convex.mutation(api.mutations.orders.processRefund, {
          orderId: order._id,
          refundId: refund.id,
          amount: refundAmount ? refundAmount / 100 : order.total_amount,
          reason: 'requested_by_customer',
          processedBy: payload.user_id,
          description: `Automatic refund for cancelled order: ${description || reason}`,
          metadata: {
            stripeRefundId: refund.id,
            cancelledBy: payload.user_id,
            cancelledByRole: payload.role,
            cancellationReason: reason,
            ...metadata
          }
        });

        refundResult = {
          id: refund.id,
          amount: refundAmount ? refundAmount / 100 : order.total_amount,
          currency: 'gbp',
          status: refund.status,
          reason: refund.reason,
          created: refund.created
        };

        console.log(`Automatic refund processed: ${refund.id} for cancelled order ${orderId}`);

      } catch (stripeError: any) {
        console.error('Automatic refund failed:', stripeError);
        // Don't fail the cancellation if refund fails
        refundResult = {
          error: 'Refund processing failed',
          details: stripeError.message
        };
      }
    }

    console.log(`Order cancelled: ${orderId} by ${payload.user_id} (${payload.role}), reason: ${reason}`);

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return ResponseFactory.internalError('Failed to cancel order');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 