import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { stripe } from '@/lib/stripe';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /payments/manage:
 *   post:
 *     summary: Manage Payment Operations
 *     description: Admin/staff endpoint for managing payment operations (capture, void, update payment method)
 *     tags: [Payments, Admin]
 *     parameters:
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [capture, void, update-payment-method]
 *         description: Payment management action to perform
 *         example: "capture"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: Capture payment request
 *                 required:
 *                   - paymentIntentId
 *                 properties:
 *                   paymentIntentId:
 *                     type: string
 *                     description: Stripe payment intent ID
 *                     example: "pi_1234567890abcdef"
 *                   amount:
 *                     type: number
 *                     description: Amount to capture (optional, defaults to full amount)
 *                     example: 2500
 *                   description:
 *                     type: string
 *                     description: Description for the capture
 *                     example: "Order fulfillment capture"
 *                   metadata:
 *                     type: object
 *                     description: Additional metadata
 *                     example: {"reason": "order_completed"}
 *               - type: object
 *                 description: Void payment request
 *                 required:
 *                   - paymentIntentId
 *                 properties:
 *                   paymentIntentId:
 *                     type: string
 *                     description: Stripe payment intent ID
 *                     example: "pi_1234567890abcdef"
 *                   reason:
 *                     type: string
 *                     description: Reason for voiding
 *                     example: "Customer cancellation"
 *                   metadata:
 *                     type: object
 *                     description: Additional metadata
 *                     example: {"reason": "customer_request"}
 *               - type: object
 *                 description: Update payment method request
 *                 required:
 *                   - paymentIntentId
 *                   - paymentMethodId
 *                 properties:
 *                   paymentIntentId:
 *                     type: string
 *                     description: Stripe payment intent ID
 *                     example: "pi_1234567890abcdef"
 *                   paymentMethodId:
 *                     type: string
 *                     description: New payment method ID
 *                     example: "pm_1234567890abcdef"
 *                   metadata:
 *                     type: object
 *                     description: Additional metadata
 *                     example: {"updated_reason": "card_expired"}
 *     responses:
 *       200:
 *         description: Payment operation completed successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing parameters or invalid action
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
 *         description: Forbidden - insufficient permissions (admin/staff only)
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

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface PaymentCaptureRequest {
  paymentIntentId: string;
  amount?: number; // Optional: partial capture amount
  description?: string;
  metadata?: Record<string, string>;
}

interface PaymentVoidRequest {
  paymentIntentId: string;
  reason?: string;
  metadata?: Record<string, string>;
}

interface PaymentMethodUpdateRequest {
  paymentIntentId: string;
  paymentMethodId: string;
  metadata?: Record<string, string>;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
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

    // Check if user has permission to manage payments
    if (!['admin', 'staff'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return ResponseFactory.validationError('Missing required parameter: action.');
    }

    const convex = getConvexClient();

    switch (action) {
      case 'capture':
        return await handleCapture(request, payload, convex);
      case 'void':
        return await handleVoid(request, payload, convex);
      case 'update-payment-method':
        return await handleUpdatePaymentMethod(request, payload, convex);
      default:
        return ResponseFactory.validationError('Invalid action specified.');
    }

  } catch (error: any) {
    console.error('Payment management error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to process payment management request.' 
    );
  }
}

async function handleCapture(request: NextRequest, payload: any, convex: any): Promise<NextResponse> {
  if (!stripe) {
    return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
  }
  
  const body: PaymentCaptureRequest = await request.json();
  const { paymentIntentId, amount, description, metadata } = body;

  if (!paymentIntentId) {
    return ResponseFactory.validationError('Missing required field: paymentIntentId.');
  }

  try {
    // Get payment intent to check current status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'requires_capture') {
      return ResponseFactory.validationError('Payment intent cannot be captured. Current status: ${paymentIntent.status}');
    }

    // Prepare capture data
    const captureData: any = {
      metadata: {
        capturedBy: payload.user_id,
        capturedByRole: payload.role,
        ...metadata
      }
    };

    if (amount && amount > 0) {
      const maxAmount = paymentIntent.amount;
      if (amount > maxAmount) {
        return ResponseFactory.validationError('Capture amount cannot exceed payment intent amount.');
      }
      captureData.amount_to_capture = amount;
    }

    if (description) {
      captureData.description = description;
    }

    // Capture the payment
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId, captureData);

    // Update order status in database
    const orders = await convex.query(api.queries.orders.listByCustomer, { 
      customer_id: paymentIntent.metadata?.userId || 'unknown' 
    });
    
    const order = orders.find((o: any) => o.payment_id === paymentIntentId);
    if (order) {
      await convex.mutation(api.mutations.orders.updateOrderStatus, {
        userId: order.customer_id,
        paymentIntentId,
        status: 'confirmed',
        amount: capturedPayment.amount / 100,
        currency: capturedPayment.currency
      });
    }

    console.log(`Payment captured: ${paymentIntentId} by ${payload.user_id} (${payload.role})`);

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error capturing payment:', error);
    return ResponseFactory.internalError('Failed to capture payment');
  }
}

async function handleVoid(request: NextRequest, payload: any, convex: any) {
  if (!stripe) {
    return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
  }
  
  const body: PaymentVoidRequest = await request.json();
  const { paymentIntentId, reason, metadata } = body;

  if (!paymentIntentId) {
    return ResponseFactory.validationError('Missing required field: paymentIntentId.');
  }

  try {
    // Get payment intent to check current status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'requires_capture') {
      return ResponseFactory.validationError('Payment intent cannot be voided. Current status: ${paymentIntent.status}');
    }

    // Cancel the payment intent
    const voidedPayment = await stripe.paymentIntents.cancel(paymentIntentId);

    // Update order status in database
    const orders = await convex.query(api.queries.orders.listByCustomer, { 
      customer_id: paymentIntent.metadata?.userId || 'unknown' 
    });
    
    const order = orders.find((o: any) => o.payment_id === paymentIntentId);
    if (order) {
      await convex.mutation(api.mutations.orders.updateOrderStatus, {
        userId: order.customer_id,
        paymentIntentId,
        status: 'canceled',
        amount: voidedPayment.amount / 100,
        currency: voidedPayment.currency
      });
    }

    console.log(`Payment voided: ${paymentIntentId} by ${payload.user_id} (${payload.role})`);

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error voiding payment:', error);
    return ResponseFactory.internalError('Failed to void payment');
  }
}

async function handleUpdatePaymentMethod(request: NextRequest, payload: any, convex: any) {
  if (!stripe) {
    return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
  }
  
  const body: PaymentMethodUpdateRequest = await request.json();
  const { paymentIntentId, paymentMethodId, metadata } = body;

  if (!paymentIntentId || !paymentMethodId) {
    return ResponseFactory.validationError('Missing required fields: paymentIntentId and paymentMethodId.');
  }

  try {
    // Update the payment intent with new payment method
    const updatedPayment = await stripe!.paymentIntents.update(paymentIntentId, {
      payment_method: paymentMethodId,
      metadata: {
        updatedBy: payload.user_id,
        updatedByRole: payload.role,
        ...metadata
      }
    });

    console.log(`Payment method updated: ${paymentIntentId} by ${payload.user_id} (${payload.role})`);

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return ResponseFactory.internalError('Failed to update payment method');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 