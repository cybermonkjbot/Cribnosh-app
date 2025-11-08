import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
/**
 * @swagger
 * /admin/orders/mark-non-refundable:
 *   post:
 *     summary: Mark Order as Non-Refundable (Admin)
 *     description: Mark an order as non-refundable, revoking its refund eligibility. This endpoint allows administrators to prevent refunds for orders that violate terms of service, involve fraud, or for other business policy reasons. Can override the standard 24-hour refund window.
 *     tags: [Admin, Order Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - reason
 *               - description
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Unique identifier of the order to mark as non-refundable
 *                 example: "j1234567890abcdef"
 *               reason:
 *                 type: string
 *                 enum: [admin_override, fraud_detected, terms_violation, customer_agreement, business_policy, other]
 *                 description: Reason for marking the order as non-refundable
 *                 example: "fraud_detected"
 *               description:
 *                 type: string
 *                 description: Detailed description of why the order is being marked as non-refundable
 *                 example: "Payment method flagged as fraudulent by payment processor"
 *               effectiveImmediately:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to revoke refund eligibility immediately, overriding the 24-hour window
 *                 example: true
 *               metadata:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Additional metadata for audit purposes
 *                 example: {"fraudScore": "high", "paymentProcessorAlert": "true"}
 *     responses:
 *       200:
 *         description: Order marked as non-refundable successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Order marked as non-refundable successfully"
 *                     orderId:
 *                       type: string
 *                       description: ID of the updated order
 *                       example: "j1234567890abcdef"
 *                     refundEligible:
 *                       type: boolean
 *                       description: New refund eligibility status
 *                       example: false
 *                     reason:
 *                       type: string
 *                       description: Reason provided for the change
 *                       example: "fraud_detected"
 *                     description:
 *                       type: string
 *                       description: Description provided for the change
 *                       example: "Payment method flagged as fraudulent by payment processor"
 *                 message:
 *                   type: string
 *                   example: "Order marked as non-refundable successfully"
 *       400:
 *         description: Bad request - missing required fields, order already non-refundable, or still within refund window
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
 *         description: Forbidden - admin access required
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

interface MarkNonRefundableRequest {
  orderId: string;
  reason: 'admin_override' | 'fraud_detected' | 'terms_violation' | 'customer_agreement' | 'business_policy' | 'other';
  description: string;
  effectiveImmediately?: boolean; // If true, overrides 24-hour window
  metadata?: Record<string, string>;
}

async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);// Check if user has admin permissions
    

    const body: MarkNonRefundableRequest = await request.json();
    const { orderId, reason, description, effectiveImmediately = false, metadata } = body;

    if (!orderId || !reason || !description) {
      return ResponseFactory.validationError('Missing required fields: orderId, reason, and description are required.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Check if order is already non-refundable
    if (order.is_refundable === false) {
      return ResponseFactory.validationError('Order is already marked as non-refundable');
    }

    // Check if order is in a non-refundable status
    if (['completed', 'cancelled'].includes(order.order_status)) {
      return ResponseFactory.validationError('Cannot modify refund eligibility for completed or cancelled orders');
    }

    // Check if 24-hour window has passed (unless admin override)
    const now = Date.now();
    if (!effectiveImmediately && order.delivered_at && order.refund_eligible_until && now <= order.refund_eligible_until) {
      return ResponseFactory.validationError('Order is still within refund eligibility window');
    }

    // Update refund eligibility
    const updatedOrder = await convex.mutation(api.mutations.orders.updateRefundEligibility, {
      orderId: order._id,
      updatedBy: (userId || payload.userId) as Id<"users">,
      reason: `Admin override: ${description}`,
      metadata: {
        adminReason: reason,
        adminDescription: description,
        effectiveImmediately,
        adminUserId: userId,
        adminOverride: true,
        originalRefundEligibleUntil: order.refund_eligible_until,
        originalIsRefundable: order.is_refundable,
        ...metadata
      }
    });

    console.log(`Order ${orderId} marked as non-refundable by admin ${userId}: ${reason} - ${description}`);

    return ResponseFactory.success({
      success: true,
      message: 'Order marked as non-refundable successfully',
      orderId: order._id,
      refundEligible: false,
      reason: reason,
      description: description
    }, 'Order marked as non-refundable successfully');
  } catch (error: unknown) {
    console.error('Error marking order as non-refundable:', error);
    return ResponseFactory.internalError('Failed to mark order as non-refundable');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 