// @ts-nocheck
"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

const getStripe = () => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey.trim().length === 0) {
        return null;
    }
    return new Stripe(stripeSecretKey.trim(), {
        apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion,
    });
};

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = action({
    args: {
        signature: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        const stripe = getStripe();
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!stripe) {
            console.error("Stripe not configured");
            return { success: false, error: "Stripe not configured" };
        }

        if (!webhookSecret) {
            console.error("STRIPE_WEBHOOK_SECRET not configured");
            return { success: false, error: "STRIPE_WEBHOOK_SECRET not configured" };
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(args.body, args.signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return { success: false, error: `Signature verification failed: ${err.message}` };
        }

        console.log(`Processing Stripe webhook event: ${event.type}`);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const paymentIntentId = paymentIntent.id;

            try {
                // 1. Check if order already exists for this payment
                const existingOrders = await ctx.runQuery(api.queries.orders.getByPaymentId, {
                    payment_id: paymentIntentId,
                });

                if (existingOrders && existingOrders.length > 0) {
                    console.log(`Order for payment ${paymentIntentId} already exists. Skipping reconciliation.`);
                    return { success: true };
                }

                // 2. Fetch pending order snapshot
                const pendingOrder = await ctx.runQuery(api.queries.pendingOrders.getByPaymentIntentId, {
                    paymentIntentId,
                });

                if (!pendingOrder) {
                    console.warn(`No pending order found for payment intent ${paymentIntentId}. No data for reconciliation.`);
                    return { success: true }; // Return true because we can't do anything else
                }

                console.log(`Starting reconciliation for pending order: ${pendingOrder._id}`);

                // 3. Reconstruct items grouping by chef
                const cartItems = pendingOrder.cartItemsSnapshot;

                // Fetch all meals to get chef IDs (snapshot has dish_id)
                const allMeals = await ctx.runQuery(api.queries.meals.getAll, {});
                const mealMap = new Map();
                (allMeals || []).forEach(m => mealMap.set(m._id, m));

                const itemsByChef = new Map();
                for (const item of cartItems) {
                    const meal = mealMap.get(item.dish_id);
                    if (!meal) {
                        console.error(`Meal ${item.dish_id} not found during reconciliation!`);
                        continue;
                    }
                    const chefId = (meal.chefId || meal.chef_id).toString();
                    if (!itemsByChef.has(chefId)) itemsByChef.set(chefId, []);
                    itemsByChef.get(chefId).push(item);
                }

                if (itemsByChef.size === 0) {
                    console.error("No valid chef items found in pending order snapshot.");
                    return { success: true };
                }

                const totalCartValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                // 4. Create separate orders for each chef
                for (const [chefId, orderItems] of itemsByChef.entries()) {
                    const chefTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const chefProportion = totalCartValue > 0 ? chefTotal / totalCartValue : 0;
                    const chefPointsApplied = pendingOrder.noshPointsApplied
                        ? Math.floor(pendingOrder.noshPointsApplied * chefProportion)
                        : undefined;

                    await ctx.runMutation(api.mutations.orders.createOrderWithPayment, {
                        customer_id: pendingOrder.userId.toString(),
                        chef_id: chefId,
                        order_items: orderItems,
                        total_amount: chefTotal,
                        payment_id: paymentIntentId,
                        payment_method: pendingOrder.payment_method || 'card',
                        special_instructions: pendingOrder.specialInstructions,
                        delivery_address: pendingOrder.deliveryAddress,
                        nosh_points_applied: chefPointsApplied,
                        gameDebtId: pendingOrder.gameDebtId,
                    });
                }

                console.log(`Successfully reconciled orders for payment ${paymentIntentId}`);

                // 5. Cleanup pending order
                await ctx.runMutation(api.mutations.pendingOrders.remove, {
                    paymentIntentId,
                });

                // 6. Clear user cart if still present
                try {
                    await ctx.runMutation(api.mutations.orders.clearCart, {
                        userId: pendingOrder.userId,
                    });
                } catch (e) {
                    console.warn("Failed to clear cart during reconciliation:", e);
                }
            } catch (error) {
                console.error(`Error during payment reconciliation: ${error}`);
                return { success: false, error: String(error) };
            }
        }

        return { success: true };
    },
});
