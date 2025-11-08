import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { processRefund } from '@/lib/services/payment-service';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /customer/orders/{order_id}/cancel:
 *   post:
 *     summary: Cancel a customer's order
 *     description: Cancel an order. Refund preference can be full_refund, partial_refund, or credit.
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to cancel
 *         example: "ORD-12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 example: "Customer requested cancellation"
 *               refund_preference:
 *                 type: string
 *                 enum: [full_refund, partial_refund, credit]
 *                 default: "full_refund"
 *                 example: "full_refund"
 *     responses:
 *       200:
 *         description: Order cancellation request submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order cancellation request submitted"
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id:
 *                       type: string
 *                       example: "ORD-12345"
 *                     status:
 *                       type: string
 *                       example: "cancellation_pending"
 *                     refund_status:
 *                       type: string
 *                       example: "pending"
 *                     cancelled_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Order cannot be cancelled (already delivered, too late, etc.)
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Order not found
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { order_id: string } }
): Promise<NextResponse> {
  try {
    const { order_id } = params;
    
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    if (!order_id) {
      return createSpecErrorResponse(
        'order_id is required',
        'BAD_REQUEST',
        400
      );
    }

    // Parse and validate request body
    let body: { reason?: string; refund_preference?: string };
    try {
      body = await request.json();
    } catch {
      body = {}; // Body is optional
    }

    const { refund_preference = 'full_refund' } = body;

    // Validate refund_preference
    if (!['full_refund', 'partial_refund', 'credit'].includes(refund_preference)) {
      return createSpecErrorResponse(
        'refund_preference must be one of: full_refund, partial_refund, credit',
        'BAD_REQUEST',
        400
      );
    }

    const convex = getConvexClientFromRequest(request);

    // Query order and verify ownership
    const order = await convex.query(api.queries.orders.getById, { order_id });
    
    if (!order) {
      return createSpecErrorResponse(
        'Order not found',
        'NOT_FOUND',
        404
      );
    }

    const orderData = order as { customer_id?: Id<'users'> | string; order_status?: string; status?: string; currency?: string; payment_id?: string; total_amount?: number; _id?: Id<'orders'>; chef_id?: Id<'chefs'> | string };
    
    if (orderData.customer_id !== userId && String(orderData.customer_id) !== String(userId)) {
      return createSpecErrorResponse(
        'Order not found',
        'NOT_FOUND',
        404
      );
    }

    // Check if order can be cancelled
    const orderStatus: string = (orderData.order_status || orderData.status) ?? '';
    if (orderStatus && ['delivered', 'cancelled', 'completed'].includes(orderStatus as string)) {
      return createSpecErrorResponse(
        'Order cannot be cancelled. Order is already delivered, cancelled, or completed.',
        'BAD_REQUEST',
        400
      );
    }

    // Cancel the order using updateStatus mutation (uses order_id string)
    await convex.mutation(api.mutations.orders.updateStatus, {
      order_id: order_id,
      status: 'cancelled',
    });

    // Get currency from order or payment, default to GBP
    const orderCurrency = orderData.currency || 'GBP';
    const paymentId = orderData.payment_id;

    // Process refund based on refund_preference
    if (refund_preference === 'full_refund' || refund_preference === 'partial_refund') {
      // Process refund through payment provider (Stripe)
      if (paymentId) {
        try {
          const refundAmount = refund_preference === 'partial_refund' && orderData.total_amount ? orderData.total_amount * 0.5 : undefined;
          const refund = await processRefund(
            paymentId,
            refundAmount,
            'requested_by_customer'
          );

          // Update order with refund information
          if (orderData._id) {
            await convex.mutation(api.mutations.orders.processRefund, {
              orderId: orderData._id,
              refundId: refund.id,
              amount: refund.amount,
              reason: 'requested_by_customer',
              processedBy: userId,
              description: `Refund for cancelled order: ${order_id}`,
            });

            // Add refund to customer balance if credit refund
            await convex.mutation(api.mutations.customerBalance.addTransaction, {
              userId,
              type: 'credit',
              amount: refund.amount,
              currency: orderCurrency,
              description: `Refund from order cancellation: ${order_id}`,
              status: 'completed',
              order_id: orderData._id,
            });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Refund processing failed:', errorMessage);
          // Continue with cancellation even if refund fails
          // Customer can contact support for manual refund
        }
      }
    } else if (refund_preference === 'credit') {
      // Add credit to customer balance
      const orderAmount = orderData.total_amount || 0;
      if (orderData._id) {
        await convex.mutation(api.mutations.customerBalance.addTransaction, {
          userId,
          type: 'credit',
          amount: orderAmount,
          currency: orderCurrency,
          description: `Refund from order cancellation: ${order_id}`,
          status: 'pending',
          order_id: orderData._id,
        });
      }
    }

    return ResponseFactory.success(
      {
        order_id,
        status: 'cancellation_pending',
        refund_status: 'pending',
        cancelled_at: new Date().toISOString(),
      },
      'Order cancellation request submitted'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
    return createSpecErrorResponse(
      errorMessage,
      'INTERNAL_ERROR',
      500
    );
  }
}

// Wrapper to extract params from URL
const wrappedHandler = (request: NextRequest) => {
  const url = new URL(request.url);
  const order_id = url.pathname.split('/').pop() || '';
  return handlePOST(request, { params: { order_id } });
};

export const POST = withAPIMiddleware(withErrorHandling(wrappedHandler));

