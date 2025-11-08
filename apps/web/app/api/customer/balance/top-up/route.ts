import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getOrCreateCustomer, stripe } from '@/lib/stripe';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
const MIN_TOP_UP_AMOUNT = 100; // £1.00 minimum in pence

/**
 * @swagger
 * /customer/balance/top-up:
 *   post:
 *     summary: Top up Cribnosh balance
 *     description: Create a payment intent for adding funds to customer's Cribnosh balance
 *     tags: [Customer, Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 100
 *                 description: Amount in smallest currency unit (pence for GBP)
 *                 example: 1000
 *               payment_method_id:
 *                 type: string
 *                 nullable: true
 *                 description: Payment method ID for immediate confirmation
 *                 example: "pm_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Payment intent created successfully
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
 *                     clientSecret:
 *                       type: string
 *                       description: Stripe client secret for payment confirmation
 *                       example: "pi_1234567890abcdef_secret_abcdef1234567890"
 *                     paymentIntentId:
 *                       type: string
 *                       description: Stripe payment intent ID
 *                       example: "pi_1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - invalid amount or missing required fields
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error or Stripe configuration error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId, user } = await getAuthenticatedCustomer(request);

    const { amount, payment_method_id } = await request.json();

    // Validation
    if (!amount || typeof amount !== 'number' || amount < MIN_TOP_UP_AMOUNT) {
      return createSpecErrorResponse(
        `Amount is required and must be at least £${(MIN_TOP_UP_AMOUNT / 100).toFixed(2)} (${MIN_TOP_UP_AMOUNT} pence)`,
        'VALIDATION_ERROR',
        400
      );
    }

    // Fetch user from database to get email (user already captured from auth)
    const convex = getConvexClient();
    if (!user) {
      return createSpecErrorResponse(
        'User not found',
        'NOT_FOUND',
        404
      );
    }

    const email = user.email;
    if (!email) {
      return createSpecErrorResponse(
        'User email required',
        'VALIDATION_ERROR',
        400
      );
    }

    if (!stripe) {
      return createSpecErrorResponse(
        'Stripe is not configured',
        'INTERNAL_ERROR',
        500
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({ userId, email });

    // If payment method is provided, verify it's attached to the customer
    if (payment_method_id) {
      try {
        // Retrieve the payment method to check if it's attached to the customer
        const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
        
        // If payment method is not attached to the customer, attach it
        if (paymentMethod.customer !== customer.id) {
          await stripe.paymentMethods.attach(payment_method_id, {
            customer: customer.id,
          });
        }
      } catch (error: unknown) {
        // If payment method doesn't exist or can't be attached, return error
        return createSpecErrorResponse(
          `Invalid payment method: ${getErrorMessage(error, 'Payment method not found or cannot be attached')}`,
          'VALIDATION_ERROR',
          400
        );
      }
    }

    // Create payment intent with balance top-up metadata
    const params: any = {
      amount,
      currency: 'gbp',
      customer: customer.id,
      metadata: {
        type: 'balance_topup',
        user_id: userId,
        source: 'mobile_app',
      },
      setup_future_usage: 'off_session',
    };

    // If payment method is provided, attach it but don't confirm server-side
    // Client-side confirmation handles 3D Secure if needed
    if (payment_method_id) {
      params.payment_method = payment_method_id;
      // Don't confirm server-side - let client handle confirmation with 3D Secure if needed
    }

    const paymentIntent = await stripe.paymentIntents.create(params);

    return ResponseFactory.success({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(
        error.message,
        'UNAUTHORIZED',
        401
      );
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to create top-up payment intent'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

