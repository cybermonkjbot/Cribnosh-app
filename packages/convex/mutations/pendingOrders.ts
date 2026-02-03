// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a pending order record
 */
export const create = mutation({
    args: {
        paymentIntentId: v.string(),
        userId: v.id("users"),
        cartItemsSnapshot: v.array(v.object({
            dish_id: v.id("meals"),
            quantity: v.number(),
            price: v.number(),
            name: v.string(),
        })),
        deliveryAddress: v.optional(v.object({
            street: v.string(),
            city: v.string(),
            postcode: v.string(),
            country: v.string(),
        })),
        specialInstructions: v.optional(v.string()),
        noshPointsApplied: v.optional(v.number()),
        gameDebtId: v.optional(v.string()),
        payment_method: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if it already exists
        const existing = await ctx.db
            .query("pendingOrders")
            .withIndex("by_payment_intent", (q) => q.eq("paymentIntentId", args.paymentIntentId))
            .first();

        if (existing) {
            // Update existing if it matches
            await ctx.db.patch(existing._id, {
                ...args,
                createdAt: Date.now(),
            });
            return existing._id;
        }

        const pendingOrderId = await ctx.db.insert("pendingOrders", {
            ...args,
            createdAt: Date.now(),
        });
        return pendingOrderId;
    },
});

/**
 * Remove a pending order after it has been reconciled
 */
export const remove = mutation({
    args: {
        paymentIntentId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("pendingOrders")
            .withIndex("by_payment_intent", (q) => q.eq("paymentIntentId", args.paymentIntentId))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});
