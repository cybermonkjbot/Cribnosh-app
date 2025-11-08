import { getOrCreateCustomer } from '@/lib/stripe';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

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
    const customer = await getOrCreateCustomer({ userId, email });
    return ResponseFactory.success({ stripeCustomerId: customer.id });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create customer'));
  }
} 