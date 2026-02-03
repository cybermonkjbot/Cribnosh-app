// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Record payment event from Stripe webhook
export const recordPaymentEvent = mutation({
  args: {
    paymentId: v.string(),
    orderId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    eventType: v.union(
      // Payment events
      v.literal("payment_intent.created"),
      v.literal("payment_intent.succeeded"),
      v.literal("payment_intent.payment_failed"),
      v.literal("payment_intent.canceled"),
      v.literal("payment_intent.processing"),
      v.literal("payment_intent.requires_action"),
      // Charge events
      v.literal("charge.succeeded"),
      v.literal("charge.failed"),
      v.literal("charge.refunded"),
      v.literal("charge.dispute.created"),
      v.literal("charge.dispute.closed"),
      // Subscription events
      v.literal("subscription.created"),
      v.literal("subscription.updated"),
      v.literal("subscription.deleted"),
      // Refund events
      v.literal("refund.created"),
      v.literal("refund.succeeded"),
      v.literal("refund.failed"),
    ),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    paymentMethodType: v.optional(v.string()),
    status: v.optional(v.string()),
    failureCode: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    metadata: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("paymentAnalyticsData", {
      paymentId: args.paymentId,
      orderId: args.orderId,
      userId: args.userId,
      eventType: args.eventType,
      amount: args.amount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      paymentMethodType: args.paymentMethodType,
      status: args.status,
      failureCode: args.failureCode,
      failureReason: args.failureReason,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
    
    console.log(`Recorded payment event: ${args.eventType} for payment ${args.paymentId}`, {
      amount: args.amount,
      currency: args.currency,
      userId: args.userId,
    });
    return eventId;
  },
});

