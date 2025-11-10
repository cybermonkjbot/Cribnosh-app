import { getOrCreateCustomer, stripe } from '@/lib/stripe';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Get Payment History
 *     description: Retrieve payment history for the authenticated user
 *     tags: [Payments, History]
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
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
 *                     payments:
 *                       type: array
 *                       description: Array of payment intents
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Payment intent ID
 *                             example: "pi_1234567890abcdef"
 *                           amount:
 *                             type: number
 *                             description: Amount in cents
 *                             example: 2500
 *                           currency:
 *                             type: string
 *                             description: Currency code
 *                             example: "usd"
 *                           status:
 *                             type: string
 *                             enum: [requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded]
 *                             description: Payment status
 *                             example: "succeeded"
 *                           client_secret:
 *                             type: string
 *                             description: Client secret for frontend
 *                             example: "pi_1234567890abcdef_secret_abcdef"
 *                           description:
 *                             type: string
 *                             nullable: true
 *                             description: Payment description
 *                             example: "Order #ORD-12345"
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             description: Payment metadata
 *                             example: {"order_id": "ORD-12345", "user_id": "j1234567890abcdef"}
 *                           created:
 *                             type: number
 *                             description: Creation timestamp
 *                             example: 1640995200
 *                           amount_received:
 *                             type: number
 *                             nullable: true
 *                             description: Amount actually received
 *                             example: 2500
 *                           receipt_email:
 *                             type: string
 *                             nullable: true
 *                             description: Receipt email
 *                             example: "user@example.com"
 *                           shipping:
 *                             type: object
 *                             nullable: true
 *                             description: Shipping information
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "John Doe"
 *                               address:
 *                                 type: object
 *                                 properties:
 *                                   line1:
 *                                     type: string
 *                                     example: "123 Main St"
 *                                   city:
 *                                     type: string
 *                                     example: "London"
 *                                   postal_code:
 *                                     type: string
 *                                     example: "SW1A 1AA"
 *                                   country:
 *                                     type: string
 *                                     example: "GB"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error - user email required
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest) {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    
    const email = user.email;
    if (!email) {
      return ResponseFactory.validationError('User email required.');
    }
    const customer = await getOrCreateCustomer({ userId, email });
  if (!stripe) {
    return ResponseFactory.serviceUnavailable('Stripe is not configured');
  }
  const paymentIntents = await stripe.paymentIntents.list({
    customer: customer.id,
    limit: 20,
  });
  return ResponseFactory.success({ payments: paymentIntents.data });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to retrieve payment history'));
  }
}

export const GET = withErrorHandling(handleGET); 