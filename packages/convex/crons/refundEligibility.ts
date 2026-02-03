// @ts-nocheck
import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

// Internal mutation to update refund eligibility for expired orders
export const updateExpiredRefundEligibility = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find orders that are delivered but have passed the 24-hour refund window
    const expiredOrders = await ctx.db
      .query("orders")
      .withIndex("by_refund_eligible", (q) => 
        q.eq("is_refundable", true)
         .lt("refund_eligible_until", now)
      )
      .collect();

    console.log(`Found ${expiredOrders.length} orders with expired refund eligibility`);

    // Update each expired order
    for (const order of expiredOrders) {
      await ctx.db.patch(order._id, {
        is_refundable: false,
        updatedAt: now,
      });

      // Add to order history
      await ctx.db.insert("orderHistory", {
        order_id: order._id,
        action: "refund_eligibility_updated",
        performed_by: "system" as any, // System action
        description: "24-hour refund window expired - automatic update",
        metadata: {
          isRefundable: false,
          eligibilityReason: "24-hour refund window has expired",
          reason: "automatic_expiry",
          expiredAt: now,
        },
        performed_at: now,
      });

      console.log(`Updated order ${order._id} refund eligibility to false (expired)`);
    }

    return {
      updatedOrders: expiredOrders.length,
      timestamp: now,
    };
  },
});

// Schedule the job to run every hour
const crons = cronJobs();

crons.interval(
  "update-refund-eligibility",
  { hours: 1 },
  internal.crons.refundEligibility.updateExpiredRefundEligibility,
  {}
);

export default crons; 