"use node";
import { v } from "convex/values";
import Stripe from "stripe";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

// Helper to get Stripe instance (reusing logic from payments.ts ideally, but duplicating for isolation)
const getStripe = () => {
    // TEMPORARY TEST KEY - REMOVE BEFORE PRODUCTION
    const FALLBACK_TEST_KEY = 'sk_test_51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav';

    const envKey = process.env.STRIPE_SECRET_KEY;
    const usingFallback = !envKey || envKey.trim().length === 0;
    const stripeSecretKey = usingFallback ? FALLBACK_TEST_KEY : envKey.trim();
    if (!stripeSecretKey) return null;
    return new Stripe(stripeSecretKey, {
        apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion,
    });
};

// Helper to get or create Stripe customer (lightweight version for this file)
async function getStripeCustomerId(ctx: any, userId: Id<'users'>, email: string) {
    const existing = await ctx.runQuery(api.queries.users.getStripeCustomerId, { userId });
    if (existing) return existing;

    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe not configured");

    const customer = await stripe.customers.create({
        email,
        metadata: { userId: userId.toString() },
    });

    await ctx.runMutation(api.mutations.users.setStripeCustomerId, {
        userId,
        stripeCustomerId: customer.id,
    });

    return customer.id;
}

/**
 * Pay for an existing order (Authenticated Payer)
 */
// @ts-expect-error - Type instantiation is excessively deep due to large schema
export const payForOrder = action({
    // @ts-ignore
    args: {
        sessionToken: v.string(),
        orderId: v.id("orders"),
        payment_method_id: v.optional(v.string()), // Optional, if using a saved card ID
    },
    // @ts-ignore
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
    // @ts-ignore
    handler: async (ctx, args) => {
        try {
            // 1. Authenticate User
            const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
                sessionToken: args.sessionToken,
            });

            if (!user) {
                return { success: false, error: "Authentication required" };
            }

            // 2. Fetch Order
            const order = await ctx.runQuery(api.queries.orders.getOrderById, {
                orderId: args.orderId,
            });

            if (!order) {
                return { success: false, error: "Order not found" };
            }

            if (order.payment_status === 'paid') {
                return { success: false, error: "Order is already paid" };
            }

            // 3. Setup Stripe
            const stripe = getStripe();
            if (!stripe) {
                return { success: false, error: "Stripe configuration missing" };
            }

            const stripeCustomerId = await getStripeCustomerId(ctx, user._id, user.email || "payer@cribnosh.com");

            // 4. Create Payment Intent
            // Note: If payment_method_id is provided, we could confirm immediately, 
            // but usually we create the intent and let the client confirm to handle 3DS/SCA.
            const totalAmount = order.total_amount; // Assuming this is in cents/lowest unit

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount),
                currency: 'gbp',
                customer: stripeCustomerId,
                payment_method: args.payment_method_id,
                metadata: {
                    userId: user._id.toString(), // The Payer
                    orderId: order._id.toString(), // The Order being paid
                    type: 'pay_for_me_fulfillment',
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            // 5. Return Intent to Client
            return {
                success: true,
                paymentIntent: {
                    client_secret: paymentIntent.client_secret,
                    id: paymentIntent.id,
                    amount: totalAmount,
                }
            };

        } catch (error: any) {
            console.error("Pay for Order Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Payment initialization failed";
            return { success: false, error: errorMessage };
        }
    },
});
