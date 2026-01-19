import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get a pending order by payment intent ID
 */
export const getByPaymentIntentId = query({
    args: {
        paymentIntentId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pendingOrders")
            .withIndex("by_payment_intent", (q) => q.eq("paymentIntentId", args.paymentIntentId))
            .first();
    },
});
