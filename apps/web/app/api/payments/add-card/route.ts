import { getOrCreateCustomer, stripe } from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /payments/add-card:
 *   post:
 *     summary: Add Payment Method
 *     description: Create a Stripe setup intent for adding a new payment method
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Setup intent created successfully
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
 *                       description: Stripe client secret for payment method setup
 *                       example: "seti_1234567890abcdef_secret_abcdef1234567890"
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
 *         description: Validation error - missing user email
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

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

export async function POST(request: NextRequest) {
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
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    usage: 'off_session',
  });
  return ResponseFactory.success({ clientSecret: setupIntent.client_secret });
} 