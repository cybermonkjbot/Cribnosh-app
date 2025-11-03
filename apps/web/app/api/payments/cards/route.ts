import { getOrCreateCustomer, stripe } from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /payments/cards:
 *   get:
 *     summary: Get Payment Cards
 *     description: Retrieve saved payment cards for the authenticated user
 *     tags: [Payments, Cards]
 *     responses:
 *       200:
 *         description: Payment cards retrieved successfully
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
 *                     cards:
 *                       type: array
 *                       description: Array of saved payment cards
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Payment method ID
 *                             example: "pm_1234567890abcdef"
 *                           type:
 *                             type: string
 *                             description: Payment method type
 *                             example: "card"
 *                           card:
 *                             type: object
 *                             description: Card details
 *                             properties:
 *                               brand:
 *                                 type: string
 *                                 description: Card brand
 *                                 example: "visa"
 *                               last4:
 *                                 type: string
 *                                 description: Last 4 digits of card
 *                                 example: "4242"
 *                               exp_month:
 *                                 type: number
 *                                 description: Expiration month
 *                                 example: 12
 *                               exp_year:
 *                                 type: number
 *                                 description: Expiration year
 *                                 example: 2025
 *                               funding:
 *                                 type: string
 *                                 description: Card funding type
 *                                 example: "credit"
 *                               country:
 *                                 type: string
 *                                 description: Country code
 *                                 example: "US"
 *                               fingerprint:
 *                                 type: string
 *                                 description: Card fingerprint
 *                                 example: "abcd1234"
 *                           billing_details:
 *                             type: object
 *                             description: Billing information
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "John Doe"
 *                               email:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "john@example.com"
 *                               phone:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "+1234567890"
 *                               address:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   line1:
 *                                     type: string
 *                                     example: "123 Main St"
 *                                   line2:
 *                                     type: string
 *                                     nullable: true
 *                                     example: "Apt 4B"
 *                                   city:
 *                                     type: string
 *                                     example: "London"
 *                                   state:
 *                                     type: string
 *                                     example: "England"
 *                                   postal_code:
 *                                     type: string
 *                                     example: "SW1A 1AA"
 *                                   country:
 *                                     type: string
 *                                     example: "GB"
 *                           created:
 *                             type: number
 *                             description: Creation timestamp
 *                             example: 1640995200
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */
export async function GET(request: NextRequest) {
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
  const { email } = payload;
  if (!email) {
    return ResponseFactory.validationError('User email required.');
  }
  const customer = await getOrCreateCustomer({ userId: payload.user_id, email });
  if (!stripe) {
    return ResponseFactory.internalError('Stripe is not configured');
  }
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customer.id,
    type: 'card',
  });
  return ResponseFactory.success({ cards: paymentMethods.data });
} 