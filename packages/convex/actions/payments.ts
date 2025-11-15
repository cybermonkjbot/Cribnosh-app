// @ts-nocheck - Disable type checking to avoid TS2589 "Type instantiation is excessively deep" errors
// This is necessary due to complex nested validators in Convex actions
"use node";
import { v } from "convex/values";
import Stripe from "stripe";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

// Initialize Stripe client
const getStripe = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey || stripeSecretKey.length === 0) {
    return null;
  }
  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion,
  });
};

// Helper to get or create Stripe customer
async function getOrCreateStripeCustomer(
  ctx: any,
  userId: Id<'users'>,
  email: string
): Promise<string> {
  // Get existing Stripe customer ID from database
  const existingCustomerId = await ctx.runQuery(api.queries.users.getStripeCustomerId, {
    userId,
  });

  if (existingCustomerId) {
    const stripe = getStripe();
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    try {
      // Verify customer still exists in Stripe
      await stripe.customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch {
      // Customer doesn't exist in Stripe, create new one
    }
  }

  // Create new Stripe customer
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId: userId.toString() },
  });

  // Save to database
  await ctx.runMutation(api.mutations.users.setStripeCustomerId, {
    userId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

/**
 * Customer Get Payment Methods - for mobile app direct Convex communication
 */
export const customerGetPaymentMethods = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      paymentMethods: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Get payment methods from database
      const paymentMethods = await ctx.runQuery(api.queries.paymentMethods.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        paymentMethods: paymentMethods.map((pm: any) => ({
          id: pm._id,
          type: pm.type,
          is_default: pm.is_default,
          last4: pm.last4 || null,
          brand: pm.brand || null,
          exp_month: pm.exp_month || null,
          exp_year: pm.exp_year || null,
          created_at: new Date(pm.createdAt).toISOString(),
        })),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get payment methods';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Add Payment Method - for mobile app direct Convex communication
 * Note: Payment method validation with Stripe should be done client-side or via a separate endpoint
 */
export const customerAddPaymentMethod = action({
  args: {
    sessionToken: v.string(),
    payment_method_id: v.string(),
    type: v.union(v.literal("card"), v.literal("apple_pay"), v.literal("google_pay")),
    set_as_default: v.optional(v.boolean()),
    last4: v.optional(v.string()),
    brand: v.optional(v.string()),
    exp_month: v.optional(v.number()),
    exp_year: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      paymentMethod: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Validate inputs
      if (!args.payment_method_id || !args.type) {
        return { success: false as const, error: 'payment_method_id and type are required' };
      }

      // Note: Payment method validation with Stripe should be done client-side
      // or via a separate validation endpoint before calling this action

      // Store payment method in database
      const paymentMethodId = await ctx.runMutation(api.mutations.paymentMethods.create, {
        userId: user._id,
        payment_method_id: args.payment_method_id,
        type: args.type,
        set_as_default: args.set_as_default || false,
        last4: args.last4,
        brand: args.brand,
        exp_month: args.exp_month,
        exp_year: args.exp_year,
      });

      // Get the created payment method
      const createdPaymentMethod = await ctx.runQuery(api.queries.paymentMethods.getById, {
        paymentMethodId,
        userId: user._id,
      });

      if (!createdPaymentMethod) {
        return { success: false as const, error: 'Failed to create payment method' };
      }

      const paymentMethod = {
        id: paymentMethodId,
        type: createdPaymentMethod.type,
        is_default: createdPaymentMethod.is_default,
        last4: createdPaymentMethod.last4 || null,
        brand: createdPaymentMethod.brand || null,
        exp_month: createdPaymentMethod.exp_month || null,
        exp_year: createdPaymentMethod.exp_year || null,
        created_at: new Date(createdPaymentMethod.createdAt).toISOString(),
      };

      return {
        success: true as const,
        paymentMethod,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add payment method';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Set Default Payment Method - for mobile app direct Convex communication
 */
export const customerSetDefaultPaymentMethod = action({
  args: {
    sessionToken: v.string(),
    payment_method_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      paymentMethod: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const paymentMethodId = args.payment_method_id as Id<'paymentMethods'>;

      // Verify payment method belongs to user
      const paymentMethod = await ctx.runQuery(api.queries.paymentMethods.getById, {
        paymentMethodId,
        userId: user._id,
      });

      if (!paymentMethod) {
        return { success: false as const, error: 'Payment method not found' };
      }

      // Verify payment method can be set as default
      if (paymentMethod.status !== 'active') {
        return { success: false as const, error: 'Payment method cannot be set as default' };
      }

      // Set as default
      await ctx.runMutation(api.mutations.paymentMethods.setDefault, {
        paymentMethodId,
        userId: user._id,
      });

      // Get updated payment method
      const updatedPaymentMethod = await ctx.runQuery(api.queries.paymentMethods.getById, {
        paymentMethodId,
        userId: user._id,
      });

      return {
        success: true as const,
        paymentMethod: {
          id: paymentMethodId,
          is_default: true,
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to set default payment method';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Remove Payment Method - for mobile app direct Convex communication
 */
export const customerRemovePaymentMethod = action({
  args: {
    sessionToken: v.string(),
    payment_method_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      message: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const paymentMethodId = args.payment_method_id as Id<'paymentMethods'>;

      // Verify payment method belongs to user
      const paymentMethod = await ctx.runQuery(api.queries.paymentMethods.getById, {
        paymentMethodId,
        userId: user._id,
      });

      if (!paymentMethod) {
        return { success: false as const, error: 'Payment method not found' };
      }

      // Detach payment method from Stripe if it's a card
      if (paymentMethod.type === 'card' && paymentMethod.payment_method_id) {
        const stripe = getStripe();
        if (stripe) {
          try {
            await stripe.paymentMethods.detach(paymentMethod.payment_method_id);
          } catch (stripeError: any) {
            // Log but don't fail if Stripe detach fails (payment method might already be detached)
            console.warn('Failed to detach payment method from Stripe:', stripeError?.message);
          }
        }
      }

      // Remove from database
      await ctx.runMutation(api.mutations.paymentMethods.remove, {
        paymentMethodId,
        userId: user._id,
      });

      return {
        success: true as const,
        message: 'Payment method removed successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove payment method';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Checkout (Payment Intent) - for mobile app direct Convex communication
 * Note: This requires Stripe integration. For now, we'll return an error indicating
 * that checkout should be done via the Next.js API endpoint that has Stripe configured.
 * In production, you would integrate Stripe SDK here.
 */
export const customerCreateCheckout = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      paymentIntent: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const cart = await ctx.runQuery(api.queries.orders.getUserCart, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });
      if (!cart || !cart.items || cart.items.length === 0) {
        return { success: false as const, error: 'Cart is empty' };
      }

      const total = cart.items.reduce(
        (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0),
        0
      );
      if (total <= 0) {
        return { success: false as const, error: 'Invalid order total' };
      }

      let paymentUserId = user._id;
      let isFamilyMember = false;
      let familyProfileId: Id<'familyProfiles'> | null = null;
      let memberUserId: string | null = null;
      let budgetCheck: { allowed: boolean; reason?: string; remaining?: number } | null = null;

      try {
        const familyProfile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
          userId: user._id,
        });
        if (familyProfile && familyProfile.member_user_ids?.includes(user._id)) {
          isFamilyMember = true;
          familyProfileId = familyProfile._id;
          memberUserId = user._id.toString();
          try {
            budgetCheck = await ctx.runQuery(api.queries.familyProfiles.checkBudgetAllowance, {
              family_profile_id: familyProfile._id,
              member_user_id: user._id,
              order_amount: total,
              currency: 'gbp',
            });
            if (!budgetCheck || !budgetCheck.allowed) {
              return {
                success: false as const,
                error: budgetCheck?.reason || 'Order exceeds budget limits',
              };
            }
            if (familyProfile.settings?.shared_payment_methods) {
              paymentUserId = familyProfile.parent_user_id;
            }
          } catch (error) {
            console.warn('Family budget check failed:', error);
          }
        }
      } catch (error) {
        console.warn('Family profile check failed:', error);
      }

      const stripe = getStripe();
      if (!stripe) {
        return {
          success: false as const,
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
        };
      }

      const paymentUser = await ctx.runQuery(api.queries.users._getUserByIdInternal, {
        userId: paymentUserId,
      });
      if (!paymentUser) {
        return { success: false as const, error: 'Payment user not found' };
      }

      const stripeCustomerId = await getOrCreateStripeCustomer(
        ctx,
        paymentUserId,
        paymentUser.email || 'customer@cribnosh.com'
      );

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'gbp',
        metadata: {
          userId: paymentUserId.toString(),
          orderUserId: user._id.toString(),
          orderType: isFamilyMember ? 'family_member_checkout' : 'customer_checkout',
          cartId: (cart as { _id?: string })._id?.toString() || 'unknown',
          ...(isFamilyMember && familyProfileId
            ? {
                family_profile_id: familyProfileId.toString(),
                member_user_id: memberUserId,
              }
            : {}),
        },
        automatic_payment_methods: {
          enabled: true,
        },
        customer: stripeCustomerId,
      });

      return {
        success: true as const,
        paymentIntent: {
          client_secret: paymentIntent.client_secret,
          amount: total,
          currency: 'gbp',
          id: paymentIntent.id,
          ...(isFamilyMember && budgetCheck
            ? {
                is_family_member: true,
                budget_check: {
                  allowed: budgetCheck.allowed,
                  remaining_daily: budgetCheck.remaining,
                  remaining_weekly: budgetCheck.remaining,
                  remaining_monthly: budgetCheck.remaining,
                },
              }
            : {}),
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create checkout';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Balance - for mobile app direct Convex communication
 */
export const customerGetBalance = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      balance: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Get balance from Convex
      const balance = await ctx.runQuery(api.queries.customerBalance.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        balance: balance || {
          balance: 0,
          currency: 'GBP',
          is_available: true,
          last_updated: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get balance';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Balance Transactions - for mobile app direct Convex communication
 */
export const customerGetBalanceTransactions = action({
  args: {
    sessionToken: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      transactions: v.array(v.any()),
      pagination: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const page = args.page || 1;
      const limit = args.limit || 50;
      const offset = (page - 1) * limit;

      // Get balance transactions from database
      const transactions = await ctx.runQuery(api.queries.customerBalanceTransactions.getByUserId, {
        userId: user._id,
        limit,
        offset,
      });

      // Get total count for pagination
      const totalCount = await ctx.runQuery(api.queries.customerBalanceTransactions.getCountByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        transactions: transactions.map((tx: any) => ({
          id: tx._id,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          status: tx.status,
          created_at: new Date(tx.createdAt).toISOString(),
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          total_pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get balance transactions';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Top Up Balance - for mobile app direct Convex communication
 */
export const customerTopUpBalance = action({
  args: {
    sessionToken: v.string(),
    amount: v.number(),
    payment_method_id: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      paymentIntent: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Validate amount
      if (!args.amount || args.amount < 100) {
        return {
          success: false as const,
          error: 'Amount must be at least £1.00 (100 pence)',
        };
      }

      const stripe = getStripe();
      if (!stripe) {
        return {
          success: false as const,
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
        };
      }

      // Get or create Stripe customer
      const stripeCustomerId = await getOrCreateStripeCustomer(ctx, user._id, user.email);

      // If payment method is provided, verify it's attached to the customer
      if (args.payment_method_id) {
        try {
          const paymentMethod = await stripe.paymentMethods.retrieve(args.payment_method_id);

          // If payment method is not attached to the customer, attach it
          if (paymentMethod.customer !== stripeCustomerId) {
            await stripe.paymentMethods.attach(args.payment_method_id, {
              customer: stripeCustomerId,
            });
          }
        } catch (error: any) {
          return {
            success: false as const,
            error: `Invalid payment method: ${error?.message || 'Payment method not found or cannot be attached'}`,
          };
        }
      }

      // Create payment intent for top-up
      const params: Stripe.PaymentIntentCreateParams = {
        amount: args.amount,
        currency: 'gbp',
        customer: stripeCustomerId,
        metadata: {
          type: 'balance_topup',
          user_id: user._id.toString(),
          source: 'mobile_app',
        },
        setup_future_usage: 'off_session',
      };

      // If payment method is provided, attach it
      if (args.payment_method_id) {
        params.payment_method = args.payment_method_id;
      }

      const paymentIntent = await stripe.paymentIntents.create(params);

      return {
        success: true as const,
        paymentIntent: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to top up balance';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Setup Intent - for mobile app direct Convex communication
 * Creates a Stripe SetupIntent for collecting payment method details
 */
export const customerCreateSetupIntent = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      clientSecret: v.string(),
      setupIntentId: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const stripe = getStripe();
      if (!stripe) {
        return {
          success: false as const,
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
        };
      }

      // Get or create Stripe customer
      const stripeCustomerId = await getOrCreateStripeCustomer(
        ctx,
        user._id,
        user.email || 'customer@cribnosh.com'
      );

      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
      });

      // Debug: Log setup intent creation (only in development)
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
      if (process.env.NODE_ENV === 'development') {
        console.log('Setup Intent Created:', {
          setupIntentId: setupIntent.id,
          customerId: stripeCustomerId,
          secretKeyAccountId: stripeSecretKey ? stripeSecretKey.substring(3, 33) : 'N/A', // Extract account ID from sk_test_...
        });
      }

      return {
        success: true as const,
        clientSecret: setupIntent.client_secret || '',
        setupIntentId: setupIntent.id,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create setup intent';
      return { success: false as const, error: errorMessage };
    }
  },
});
