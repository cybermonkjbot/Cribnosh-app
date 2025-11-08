import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
/**
 * @swagger
 * /admin/orders/refund-eligibility-status:
 *   get:
 *     summary: Get Order Refund Eligibility Status (Admin)
 *     description: Retrieve detailed refund eligibility information for orders. This endpoint provides comprehensive data about which orders are eligible for refunds, including time windows, reasons for ineligibility, and admin override capabilities.
 *     tags: [Admin, Order Management]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Specific order ID to check (optional)
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID (optional)
 *         example: "j0987654321fedcba"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [refundable, non-refundable, expired]
 *         description: Filter by refund eligibility status (optional)
 *         example: "refundable"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of orders to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of orders to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Refund eligibility status retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       description: Array of orders with refund eligibility information
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                             description: Order ID
 *                             example: "j1234567890abcdef"
 *                           isRefundable:
 *                             type: boolean
 *                             description: Whether the order is currently refundable
 *                             example: true
 *                           eligibility:
 *                             type: object
 *                             description: Detailed eligibility information
 *                             properties:
 *                               isEligible:
 *                                 type: boolean
 *                                 description: Whether order is eligible for refund
 *                                 example: true
 *                               reason:
 *                                 type: string
 *                                 description: Reason for eligibility status
 *                                 example: "Within 24-hour refund window"
 *                               timeRemaining:
 *                                 type: number
 *                                 nullable: true
 *                                 description: Time remaining in refund window (milliseconds)
 *                                 example: 3600000
 *                               timeExpired:
 *                                 type: number
 *                                 nullable: true
 *                                 description: Time since refund window expired (milliseconds)
 *                                 example: null
 *                               canBeOverridden:
 *                                 type: boolean
 *                                 description: Whether admin can override eligibility
 *                                 example: true
 *                               overrideReason:
 *                                 type: string
 *                                 description: Reason why override is possible/not possible
 *                                 example: "Admin can extend refund window"
 *                 message:
 *                   type: string
 *                   example: "Refund eligibility status retrieved successfully"
 *       400:
 *         description: Bad request - invalid parameters or limit exceeded
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

// Helper interface for eligibility calculation
interface OrderForEligibility {
  _id: string;
  order_id: string;
  is_refundable: boolean;
  delivered_at?: number;
  completed_at?: number;
  reviewed_at?: number;
  refund_eligible_until?: number;
  order_status: string;
}

// Type guard for status validation
function isValidStatus(status: string | null): status is 'expired' | 'refundable' | 'non-refundable' {
  return status === 'expired' || status === 'refundable' || status === 'non-refundable';
}

async function handleGET(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);// Check if user has admin permissions
    

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const customerIdParam = searchParams.get('customerId');
    const statusParam = searchParams.get('status'); // refundable, non-refundable, expired
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (limit > 100) {
      return ResponseFactory.validationError('Limit cannot exceed 100 orders.');
    }

    // Type-safe parameter conversion
    const customerId: Id<'users'> | undefined = customerIdParam ? (customerIdParam as Id<'users'>) : undefined;
    const status: 'expired' | 'refundable' | 'non-refundable' | undefined = 
      isValidStatus(statusParam) ? statusParam : undefined;

    const convex = getConvexClient();
    const now = Date.now();

    // Get orders based on filters
    let orders;
    
    if (orderId) {
      // Single order lookup
      const order = await convex.query(api.queries.orders.getOrderById, { orderId });
      orders = order ? [order] : [];
    } else {
      // Get orders with refund eligibility info
      orders = await convex.query(api.queries.orders.getOrdersWithRefundEligibility, {
        customerId,
        status,
        limit,
        offset
      });
    }

    // Process orders to add eligibility details
    const processedOrders = orders.map((order: any) => {
      const orderForEligibility: OrderForEligibility = {
        _id: order._id,
        order_id: order.order_id || '',
        is_refundable: order.is_refundable ?? false,
        delivered_at: order.delivered_at,
        completed_at: order.completed_at,
        reviewed_at: order.reviewed_at,
        refund_eligible_until: order.refund_eligible_until,
        order_status: order.order_status || '',
      };
      const eligibilityInfo = calculateEligibilityInfo(orderForEligibility, now);
      
      return {
        id: order._id,
        orderId: order.order_id,
        customerId: order.customer_id,
        chefId: order.chef_id,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        deliveredAt: order.delivered_at ? new Date(order.delivered_at).toISOString() : null,
        completedAt: order.completed_at ? new Date(order.completed_at).toISOString() : null,
        reviewedAt: order.reviewed_at ? new Date(order.reviewed_at).toISOString() : null,
        refundEligibleUntil: order.refund_eligible_until ? new Date(order.refund_eligible_until).toISOString() : null,
        isRefundable: order.is_refundable ?? false,
        eligibility: eligibilityInfo,
        createdAt: new Date(order._creationTime).toISOString(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null
      };
    });

    // Get summary statistics
    const summary = await convex.query(api.queries.orders.getRefundEligibilitySummary, {
      customerId
    });

    return ResponseFactory.success({
      orders: processedOrders,
      summary
    }, 'Refund eligibility status retrieved successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get refund eligibility status';
    logger.error('Error getting refund eligibility status:', error);
    return ResponseFactory.internalError(errorMessage);
  }
}

// Helper function to calculate eligibility information
function calculateEligibilityInfo(order: OrderForEligibility, now: number) {
  const eligibility: {
    isEligible: boolean;
    reason: string;
    timeRemaining: number | null;
    timeExpired: number | null;
    canBeOverridden: boolean;
    overrideReason: string;
  } = {
    isEligible: false,
    reason: '',
    timeRemaining: null,
    timeExpired: null,
    canBeOverridden: false,
    overrideReason: ''
  };

  // Check if order is in non-refundable status
  if (['completed', 'cancelled'].includes(order.order_status)) {
    eligibility.isEligible = false;
    eligibility.reason = `Order status is ${order.order_status}`;
    eligibility.canBeOverridden = false;
    eligibility.overrideReason = `Cannot override ${order.order_status} status`;
    return eligibility;
  }

  // Check if order is marked as non-refundable
  if (order.is_refundable === false) {
    eligibility.isEligible = false;
    eligibility.reason = 'Order marked as non-refundable';
    eligibility.canBeOverridden = true;
    eligibility.overrideReason = 'Admin can restore refund eligibility';
    return eligibility;
  }

  // Check if order has been delivered and window has expired
  if (order.delivered_at && order.refund_eligible_until) {
    if (now > order.refund_eligible_until) {
      eligibility.isEligible = false;
      eligibility.reason = '24-hour refund window has expired';
      eligibility.timeExpired = now - order.refund_eligible_until;
      eligibility.canBeOverridden = true;
      eligibility.overrideReason = 'Admin can extend refund window';
    } else {
      eligibility.isEligible = true;
      eligibility.reason = 'Within 24-hour refund window';
      eligibility.timeRemaining = order.refund_eligible_until - now;
      eligibility.canBeOverridden = true;
      eligibility.overrideReason = 'Admin can revoke refund eligibility';
    }
  } else if (order.delivered_at && !order.refund_eligible_until) {
    // Order delivered but no window set (edge case)
    eligibility.isEligible = false;
    eligibility.reason = 'No refund window set for delivered order';
    eligibility.canBeOverridden = true;
    eligibility.overrideReason = 'Admin can set refund window';
  } else {
    // Order not yet delivered
    eligibility.isEligible = true;
    eligibility.reason = 'Order not yet delivered';
    eligibility.canBeOverridden = true;
    eligibility.overrideReason = 'Admin can revoke refund eligibility';
  }

  return eligibility;
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 