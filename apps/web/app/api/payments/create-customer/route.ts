import { getOrCreateCustomer } from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /payments/create-customer:
 *   post:
 *     summary: Create Stripe Customer
 *     description: Create or retrieve a Stripe customer for the authenticated user
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Customer created or retrieved successfully
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
 *                     stripeCustomerId:
 *                       type: string
 *                       description: Stripe customer ID
 *                       example: "cus_1234567890abcdef"
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
 *         description: Internal server error
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
  return ResponseFactory.success({ stripeCustomerId: customer.id });
} 