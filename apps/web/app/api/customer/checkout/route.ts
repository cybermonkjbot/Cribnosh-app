import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getOrCreateCustomer, stripe } from '@/lib/stripe';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { Id } from '@/convex/_generated/dataModel';

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
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
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
    
    const total = cart.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
    
    // Validate total amount
    if (total <= 0) {
      return ResponseFactory.validationError('Invalid order total.');
    }

    // Check if user is a family member
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: payload.user_id as Id<'users'>,
    });

    let paymentUserId = payload.user_id;
    let isFamilyMember = false;
    let familyProfileId: Id<'familyProfiles'> | null = null;
    let memberUserId: string | null = null;
    let budgetCheck: { allowed: boolean; reason?: string; remaining?: number } | null = null;

    if (familyProfile && familyProfile.member_user_ids.includes(payload.user_id as Id<'users'>)) {
      // User is a family member - check if they can use family payment
      isFamilyMember = true;
      familyProfileId = familyProfile._id;
      memberUserId = payload.user_id;

      // Check budget limits
      budgetCheck = await convex.query(api.queries.familyProfiles.checkBudgetAllowance, {
        family_profile_id: familyProfile._id,
        member_user_id: payload.user_id as Id<'users'>,
        order_amount: total,
        currency: 'gbp',
      });

      if (!budgetCheck.allowed) {
        return ResponseFactory.validationError(
          budgetCheck.reason || 'Order exceeds budget limits'
        );
      }

      // Use parent's payment method
      if (familyProfile.settings.shared_payment_methods) {
        paymentUserId = familyProfile.parent_user_id;
      }
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
          userId: paymentUserId,
          orderUserId: payload.user_id, // Original user who placed the order
          orderType: isFamilyMember ? 'family_member_checkout' : 'customer_checkout',
          cartId: (cart as { _id?: string })._id || 'unknown',
          ...(isFamilyMember && familyProfileId
            ? {
                family_profile_id: familyProfileId,
                member_user_id: memberUserId,
              }
            : {}),
        },
        automatic_payment_methods: {
          enabled: true,
        },
        // Add customer if they have a Stripe customer ID (use parent's if family member)
        customer: await getOrCreateCustomer({ 
          userId: paymentUserId, 
          email: payload.email || 'customer@cribnosh.com' 
        }).then(customer => customer.id),
      });
      
      console.log(
        `Created payment intent ${paymentIntent.id} for user ${payload.user_id}${isFamilyMember ? ' (family member, using parent payment)' : ''}, amount: ${total} GBP`
      );
      
      return ResponseFactory.success({ 
        paymentIntent: {
          client_secret: paymentIntent.client_secret,
          amount: total,
          currency: 'gbp',
          id: paymentIntent.id
        },
        is_family_member: isFamilyMember,
        ...(isFamilyMember && budgetCheck
          ? {
              budget_check: {
                allowed: budgetCheck.allowed,
                remaining_daily: budgetCheck.remaining,
                remaining_weekly: budgetCheck.remaining,
                remaining_monthly: budgetCheck.remaining,
              },
            }
          : {}),
      });
    } catch (stripeError: unknown) {
      console.error('Stripe payment intent creation failed:', stripeError);
      return ResponseFactory.error('Payment processing failed. Please try again.', 'CUSTOM_ERROR', 500);
    }
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create payment intent.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 