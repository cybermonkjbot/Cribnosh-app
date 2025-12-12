import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
/**
 * @swagger
 * /payments/status:
 *   get:
 *     summary: Get Payment Status
 *     description: Retrieve payment status for an order or payment intent
 *     tags: [Payments, Status]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Order ID to check payment status for
 *         example: "ORD-12345"
 *       - in: query
 *         name: paymentIntentId
 *         schema:
 *           type: string
 *         description: Payment intent ID to check status for
 *         example: "pi_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
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
 *                     order:
 *                       type: object
 *                       nullable: true
 *                       description: Order details (if orderId provided)
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         order_id:
 *                           type: string
 *                           example: "ORD-12345"
 *                         customer_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         total_amount:
 *                           type: number
 *                           example: 25.99
 *                         order_status:
 *                           type: string
 *                           example: "confirmed"
 *                         payment_status:
 *                           type: string
 *                           example: "completed"
 *                     paymentIntent:
 *                       type: object
 *                       nullable: true
 *                       description: Payment intent details
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "pi_1234567890abcdef"
 *                         amount:
 *                           type: number
 *                           example: 2599
 *                         currency:
 *                           type: string
 *                           example: "gbp"
 *                         status:
 *                           type: string
 *                           enum: [requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded]
 *                           example: "succeeded"
 *                         client_secret:
 *                           type: string
 *                           example: "pi_1234567890abcdef_secret_abcdef"
 *                         description:
 *                           type: string
 *                           nullable: true
 *                           example: "Order #ORD-12345"
 *                         metadata:
 *                           type: object
 *                           nullable: true
 *                           example: {"order_id": "ORD-12345"}
 *                         created:
 *                           type: number
 *                           example: 1640995200
 *                         amount_received:
 *                           type: number
 *                           nullable: true
 *                           example: 2599
 *                         receipt_email:
 *                           type: string
 *                           nullable: true
 *                           example: "user@example.com"
 *                     paymentStatus:
 *                       type: string
 *                       description: Overall payment status
 *                       example: "completed"
 *                     canRefund:
 *                       type: boolean
 *                       description: Whether payment can be refunded
 *                       example: true
 *                     refundAmount:
 *                       type: number
 *                       nullable: true
 *                       description: Maximum refundable amount
 *                       example: 25.99
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required parameters
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
 *         description: Order or payment intent not found
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    let paymentIntentId = searchParams.get('paymentIntentId');

    if (!orderId && !paymentIntentId) {
      return ResponseFactory.validationError('Missing required parameter: orderId or paymentIntentId.');
    }

    const convex = getConvexClientFromRequest(request);
    let order = null;
    let paymentIntent = null;

    // Get order details
    if (orderId) {
      order = await convex.query(api.queries.orders.getOrderById, { orderId });
      if (!order) {
        return ResponseFactory.notFound('Order not found.');
      }

      // Verify user has permission to view this order
      if (user.roles?.[0] === 'customer' && order.customer_id !== userId) {
        return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
      }

      paymentIntentId = order.payment_id || null;
    }

    // Get payment intent details from Stripe
    if (paymentIntentId) {
      try {
        if (!stripe) {
          return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
        }
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (stripeError: any) {
        logger.error('Failed to retrieve payment intent:', stripeError);
        return ResponseFactory.internalError('Failed to retrieve payment information.');
      }
    }

    // Get refund information if payment was refunded
    let refunds: any[] = [];
    if (paymentIntent && paymentIntent.status === 'succeeded' && paymentIntentId) {
      try {
        const refundsList = await stripe!.refunds.list({
          payment_intent: paymentIntentId,
          limit: 10
        });
        refunds = refundsList.data.map(refund => ({
          id: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
          created: refund.created,
          description: refund.description
        }));
      } catch (stripeError: any) {
        logger.error('Failed to retrieve refunds:', stripeError);
        // Don't fail the request if refund retrieval fails
      }
    }

    return ResponseFactory.success({
      order: order ? {
        id: order._id,
        orderId: order.order_id,
        status: order.order_status,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        currency: 'gbp',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      } : null,
      payment: paymentIntent ? {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        customer: paymentIntent.customer,
        paymentMethod: paymentIntent.payment_method,
        lastPaymentError: paymentIntent.last_payment_error,
        metadata: paymentIntent.metadata
      } : null,
      refunds
    }, 'Payment status retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Payment status check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check payment status.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 