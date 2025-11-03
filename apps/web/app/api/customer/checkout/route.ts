import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { stripe, getOrCreateCustomer } from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/checkout:
 *   post:
 *     summary: Create Payment Intent
 *     description: Create a Stripe payment intent for checkout with items from the customer's cart
 *     tags: [Customer]
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
 *                     paymentIntent:
 *                       type: object
 *                       properties:
 *                         client_secret:
 *                           type: string
 *                           description: Stripe client secret for payment confirmation
 *                           example: "pi_1234567890abcdef_secret_abcdef1234567890"
 *                         amount:
 *                           type: number
 *                           description: Total amount in GBP
 *                           example: 31.98
 *                         currency:
 *                           type: string
 *                           description: Currency code
 *                           example: "gbp"
 *                         id:
 *                           type: string
 *                           description: Stripe payment intent ID
 *                           example: "pi_1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - cart is empty or invalid total
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
 *         description: Forbidden - only customers can checkout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or payment processing failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
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
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can checkout.');
    }
    const convex = getConvexClient();
    
    // Get user's cart
    const cart = await convex.query(api.queries.orders.getUserCart, { userId: payload.user_id });
    if (!cart || cart.items.length === 0) {
      return ResponseFactory.validationError('Cart is empty.');
    }
    
    const total = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // Validate total amount
    if (total <= 0) {
      return ResponseFactory.validationError('Invalid order total.');
    }
    
    try {
      // Create real Stripe payment intent
      if (!stripe) {
    return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
  }
  const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents and ensure integer
        currency: 'gbp', // Using GBP as per CribNosh UK focus
        metadata: {
          userId: payload.user_id,
          orderType: 'customer_checkout',
          cartId: (cart as any)._id || 'unknown'
        },
        automatic_payment_methods: {
          enabled: true,
        },
        // Add customer if they have a Stripe customer ID
        customer: await getOrCreateCustomer({ 
          userId: payload.user_id, 
          email: payload.email || 'customer@cribnosh.com' 
        }).then(customer => customer.id),
      });
      
      console.log(`Created payment intent ${paymentIntent.id} for user ${payload.user_id}, amount: ${total} GBP`);
      
      return ResponseFactory.success({ 
        paymentIntent: {
          client_secret: paymentIntent.client_secret,
          amount: total,
          currency: 'gbp',
          id: paymentIntent.id
        }
      });
    } catch (stripeError: any) {
      console.error('Stripe payment intent creation failed:', stripeError);
      return ResponseFactory.error('Payment processing failed. Please try again.', 'CUSTOM_ERROR', 500);
    }
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to create payment intent.' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 