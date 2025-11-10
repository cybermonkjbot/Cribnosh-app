import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { NextRequest } from 'next/server';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
/**
 * @swagger
 * /admin/orders/mark-refundable:
 *   post:
 *     summary: Mark Order as Refundable (Admin)
 *     description: Mark an order as refundable and optionally extend the refund window. This endpoint allows administrators to override refund eligibility for orders that may have been incorrectly marked as non-refundable or to extend refund windows for customer service purposes.
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
 *                 description: Unique identifier of the order to mark as refundable
 *                 example: "j1234567890abcdef"
 *               reason:
 *                 type: string
 *                 enum: [admin_override, customer_appeal, error_correction, business_discretion, other]
 *                 description: Reason for marking the order as refundable
 *                 example: "customer_appeal"
 *               description:
 *                 type: string
 *                 description: Detailed description of why the order is being marked as refundable
 *                 example: "Customer provided valid documentation for refund request"
 *               extendWindow:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to extend the refund window beyond the standard 24 hours
 *                 example: true
 *               newWindowHours:
 *                 type: number
 *                 default: 24
 *                 minimum: 1
 *                 maximum: 168
 *                 description: New refund window duration in hours (1-168 hours)
 *                 example: 48
 *               metadata:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Additional metadata for audit purposes
 *                 example: {"customerServiceTicket": "CS-12345", "managerApproval": "true"}
 *     responses:
 *       200:
 *         description: Order marked as refundable successfully
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
 *                       example: "Order marked as refundable successfully"
 *                     orderId:
 *                       type: string
 *                       description: ID of the updated order
 *                       example: "j1234567890abcdef"
 *                     refundEligible:
 *                       type: boolean
 *                       description: New refund eligibility status
 *                       example: true
 *                     reason:
 *                       type: string
 *                       description: Reason provided for the change
 *                       example: "customer_appeal"
 *                     description:
 *                       type: string
 *                       description: Description provided for the change
 *                       example: "Customer provided valid documentation for refund request"
 *                 message:
 *                   type: string
 *                   example: "Order marked as refundable successfully"
 *       400:
 *         description: Bad request - missing required fields or order already refundable
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

interface MarkRefundableRequest {
  orderId: string;
  reason: 'admin_override' | 'customer_appeal' | 'error_correction' | 'business_discretion' | 'other';
  description: string;
  extendWindow?: boolean; // If true, extends the refund window
  newWindowHours?: number; // New window duration in hours (default: 24)
  metadata?: Record<string, string>;
}

async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated admin from session token
    const { userId } = await getAuthenticatedAdmin(request);

    const body: MarkRefundableRequest = await request.json();
    const { orderId, reason, description, extendWindow = false, newWindowHours = 24, metadata } = body;

    if (!orderId || !reason || !description) {
      return ResponseFactory.validationError('Missing required fields: orderId, reason, and description are required.');
    }

    const convex = getConvexClientFromRequest(request);

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Check if order is already refundable
    if (order.is_refundable === true) {
      return ResponseFactory.validationError('Order is already marked as refundable');
    }

    // Check if order is in a non-refundable status that can't be overridden
    if (['completed', 'cancelled'].includes(order.order_status)) {
      return ResponseFactory.validationError('Cannot modify refund eligibility for completed or cancelled orders');
    }

    const now = Date.now();
    let newRefundEligibleUntil: number | undefined = order.refund_eligible_until;

    // Calculate new refund window if extending
    if (extendWindow) {
      if (order.delivered_at) {
        // If order was delivered, extend from current time
        newRefundEligibleUntil = now + (newWindowHours * 60 * 60 * 1000);
      } else {
        // If order not delivered yet, set window from delivery time (when it happens)
        newRefundEligibleUntil = undefined; // Will be set when order is delivered
      }
    } else if (order.refund_eligible_until && now > order.refund_eligible_until) {
      // If window has expired, restore it from current time
      newRefundEligibleUntil = now + (newWindowHours * 60 * 60 * 1000);
    }

    // Update order directly to set refund eligibility
    await convex.mutation(api.mutations.orders.updateRefundEligibility, {
      orderId: order._id,
      updatedBy: userId,
      reason: `Admin override: ${description}`,
      metadata: {
        adminReason: reason,
        adminDescription: description,
        extendWindow,
        newWindowHours,
        adminUserId: userId,
        adminOverride: true,
        originalRefundEligibleUntil: order.refund_eligible_until,
        originalIsRefundable: order.is_refundable,
        newRefundEligibleUntil,
        ...metadata
      }
    });

    // If extending window, also update the refund_eligible_until field
    if (extendWindow && newRefundEligibleUntil !== undefined) {
      await convex.mutation(api.mutations.orders.updateRefundWindow, {
        orderId: order._id,
        updatedBy: userId,
        newRefundEligibleUntil,
        reason: `Admin extended refund window: ${description}`,
        metadata: {
          adminReason: reason,
          adminDescription: description,
          newWindowHours,
          adminUserId: userId,
          adminOverride: true,
          originalRefundEligibleUntil: order.refund_eligible_until,
          ...metadata
        }
      });
    }

    logger.log(`Order ${orderId} marked as refundable by admin ${userId}: ${reason} - ${description}`);

    return ResponseFactory.success({
      success: true,
      message: 'Order marked as refundable successfully',
      orderId: order._id,
      refundEligible: true,
      reason: reason,
      description: description
    }, 'Order marked as refundable successfully');
  } catch (error: unknown) {
    logger.error('Error marking order as refundable:', error);
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError('Failed to mark order as refundable');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 