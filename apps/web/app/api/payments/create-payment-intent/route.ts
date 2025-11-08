import { getOrCreateCustomer, stripe } from '@/lib/stripe';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /payments/create-payment-intent:
 *   post:
 *     summary: Create Payment Intent
 *     description: Create a Stripe payment intent for processing payments
 *     tags: [Payments]
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
 *                 type: number
 *                 minimum: 50
 *                 description: Amount in smallest currency unit (e.g., pence for GBP)
 *                 example: 3198
 *               currency:
 *                 type: string
 *                 default: "gbp"
 *                 description: Currency code
 *                 example: "gbp"
 *               payment_method_id:
 *                 type: string
 *                 nullable: true
 *                 description: Payment method ID for immediate confirmation
 *                 example: "pm_1234567890abcdef"
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional metadata for the payment
 *                 example: {"source": "mobile_app"}
 *               orderId:
 *                 type: string
 *                 nullable: true
 *                 description: Associated order ID
 *                 example: "j1234567890abcdef"
 *               chefId:
 *                 type: string
 *                 nullable: true
 *                 description: Associated chef ID
 *                 example: "j1234567890abcdef"
 *               bookingId:
 *                 type: string
 *                 nullable: true
 *                 description: Associated booking ID
 *                 example: "j1234567890abcdef"
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
 *       500:
 *         description: Internal server error or Stripe configuration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    
    const email = user.email;
    if (!email) {
      return ResponseFactory.validationError('User email required.');
    }
    const { amount, currency = 'gbp', payment_method_id, metadata, orderId, chefId, bookingId } = await request.json();
    if (!amount || typeof amount !== 'number' || amount < 50) {
      return ResponseFactory.validationError('Amount (in smallest currency unit) is required and must be >= 50.');
    }
    const customer = await getOrCreateCustomer({ userId, email });
  const params: any = {
    amount,
    currency,
    customer: customer.id,
    metadata: {
      ...(metadata || {}),
      user_id: userId,
      ...(orderId ? { order_id: orderId } : {}),
      ...(chefId ? { chef_id: chefId } : {}),
      ...(bookingId ? { booking_id: bookingId } : {}),
    },
    setup_future_usage: 'off_session',
  };
  if (payment_method_id) {
    params.payment_method = payment_method_id;
    params.confirm = true;
    params.off_session = true;
  }
  if (!stripe) {
    return ResponseFactory.internalError('Stripe is not configured');
  }
  const paymentIntent = await stripe.paymentIntents.create(params);
  return ResponseFactory.success({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create payment intent'));
  }
} 