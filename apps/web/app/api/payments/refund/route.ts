import { stripe } from '@/lib/stripe';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Process Payment Refund
 *     description: Process a refund for a payment intent (admin only)
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
 *                 description: Stripe payment intent ID to refund
 *                 example: "pi_1234567890abcdef"
 *               amount:
 *                 type: number
 *                 nullable: true
 *                 description: Partial refund amount in smallest currency unit (optional for full refund)
 *                 example: 1599
 *     responses:
 *       200:
 *         description: Refund processed successfully
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
 *                     refund:
 *                       type: object
 *                       description: Stripe refund object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "re_1234567890abcdef"
 *                         amount:
 *                           type: number
 *                           example: 3198
 *                         currency:
 *                           type: string
 *                           example: "gbp"
 *                         status:
 *                           type: string
 *                           enum: [pending, succeeded, failed, canceled]
 *                           example: "succeeded"
 *                         reason:
 *                           type: string
 *                           example: "requested_by_customer"
 *                         created:
 *                           type: number
 *                           example: 1640995200
 *                 message:
 *                   type: string
 *                   example: "Success"
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
 *       403:
 *         description: Forbidden - only admins can process refunds
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Service unavailable - Stripe not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest) {
  try {
    // Get authenticated admin from session token
    const { user } = await getAuthenticatedAdmin(request);
    
    if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      return ResponseFactory.forbidden('Only admins can refund payments.');
    }
  const { payment_intent_id, amount } = await request.json();
  if (!payment_intent_id) {
    return ResponseFactory.validationError('payment_intent_id is required.');
  }
  const params: any = { payment_intent: payment_intent_id };
  if (amount) {
    params.amount = amount;
  }
  if (!stripe) {
    return ResponseFactory.serviceUnavailable('Stripe is not configured');
  }
  const refund = await stripe.refunds.create(params);
  return ResponseFactory.success({ refund });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process refund'));
  }
}

export const POST = withErrorHandling(handlePOST); 