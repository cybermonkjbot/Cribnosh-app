import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getOrCreateCustomer, stripe } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

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
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId, user } = await getAuthenticatedCustomer(request);
    const convex = getConvexClientFromRequest(request);
    
    // Get user's cart
    // TypeScript has issues with deep type instantiation for Convex queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep
    const cart: any = await convex.query(api.queries.orders.getUserCart, { userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      return ResponseFactory.validationError('Cart is empty.');
    }
    
    // Check if any chefs in the cart are offline
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chefAvailability: any = await convex.query(api.queries.orders.checkCartChefAvailability, { userId });
      if (chefAvailability && !chefAvailability.allChefsOnline && chefAvailability.offlineChefs && chefAvailability.offlineChefs.length > 0) {
        const offlineChefNames = chefAvailability.offlineChefs.map((c: { chefName: string }) => c.chefName).join(', ');
        return ResponseFactory.validationError(
          `Cannot proceed with checkout. The following food creator(s) are currently offline: ${offlineChefNames}. Please remove their items from your cart or wait until they come online.`
        );
      }
    } catch (error) {
      // If check fails, log but continue with checkout (fail open)
      logger.warn('Failed to check chef availability:', error);
    }
    
    const total = cart.items.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    
    // Validate total amount
    if (total <= 0) {
      return ResponseFactory.validationError('Invalid order total.');
    }

    // Check if user is a family member
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as Id<'users'>,
    });

    let paymentUserId = userId;
    let isFamilyMember = false;
    let familyProfileId: Id<'familyProfiles'> | null = null;
    let memberUserId: string | null = null;
    let budgetCheck: { allowed: boolean; reason?: string; remaining?: number } | null = null;

    if (familyProfile && familyProfile.member_user_ids.includes(userId as Id<'users'>)) {
      // User is a family member - check if they can use family payment
      isFamilyMember = true;
      familyProfileId = familyProfile._id;
      memberUserId = userId;

      // Check budget limits
      budgetCheck = await convex.query(api.queries.familyProfiles.checkBudgetAllowance, {
        family_profile_id: familyProfile._id,
        member_user_id: userId as Id<'users'>,
        order_amount: total,
        currency: 'gbp',
      });

      if (!budgetCheck || !budgetCheck.allowed) {
        return ResponseFactory.validationError(
          budgetCheck?.reason || 'Order exceeds budget limits'
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
          orderUserId: userId, // Original user who placed the order
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
          email: user.email || 'customer@cribnosh.com' 
        }).then(customer => customer.id),
      });
      
      logger.log(
        `Created payment intent ${paymentIntent.id} for user ${userId}${isFamilyMember ? ' (family member, using parent payment)' : ''}, amount: ${total} GBP`
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
      logger.error('Stripe payment intent creation failed:', stripeError);
      return ResponseFactory.error('Payment processing failed. Please try again.', 'CUSTOM_ERROR', 500);
    }
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create payment intent.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 