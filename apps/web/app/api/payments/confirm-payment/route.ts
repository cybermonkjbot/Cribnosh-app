import { stripe } from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /payments/confirm-payment:
 *   post:
 *     summary: Confirm Payment Intent
 *     description: Confirm a Stripe payment intent to complete the payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_intent_id
 *             properties:
 *               payment_intent_id:
 *                 type: string
 *                 description: Stripe payment intent ID to confirm
 *                 example: "pi_1234567890abcdef"
 *               payment_method_id:
 *                 type: string
 *                 nullable: true
 *                 description: Payment method ID to use for confirmation
 *                 example: "pm_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
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
 *                     status:
 *                       type: string
 *                       description: Payment intent status
 *                       enum: [requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded]
 *                       example: "succeeded"
 *                     paymentIntent:
 *                       type: object
 *                       description: Complete payment intent object from Stripe
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "pi_1234567890abcdef"
 *                         status:
 *                           type: string
 *                           example: "succeeded"
 *                         amount:
 *                           type: number
 *                           example: 3198
 *                         currency:
 *                           type: string
 *                           example: "gbp"
 *                         client_secret:
 *                           type: string
 *                           example: "pi_1234567890abcdef_secret_abcdef1234567890"
 *                 message:
 *                   type: string
 *                   example: "Payment confirmed successfully"
 *       400:
 *         description: Validation error - missing payment_intent_id
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
 *       - bearerAuth: []
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return ResponseFactory.unauthorized('Invalid or expired token.');
  }
  const { payment_intent_id, payment_method_id } = await request.json();
  if (!payment_intent_id) {
    return ResponseFactory.validationError('payment_intent_id is required.');
  }
  const params: any = {};
  if (payment_method_id) {
    params.payment_method = payment_method_id;
  }
  if (!stripe) {
    return ResponseFactory.internalError('Stripe is not configured');
  }
  const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, params);
  return ResponseFactory.success({ status: paymentIntent.status, paymentIntent }, 'Payment confirmed successfully');
} 