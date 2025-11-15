import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Create a claimed offer record
 */
export const create = mutation({
  args: {
    user_id: v.id("users"),
    offer_id: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already claimed
    const existing = await ctx.db
      .query("claimed_offers")
      .withIndex("by_user_offer", (q) =>
        q.eq("user_id", args.user_id).eq("offer_id", args.offer_id)
      )
      .first();

    if (existing && !existing.is_used) {
      // Return existing claim if not used
      return existing._id;
    }

    const id = await ctx.db.insert("claimed_offers", {
      user_id: args.user_id,
      offer_id: args.offer_id,
      claimed_at: now,
      is_used: false,
      expires_at: args.expires_at,
    });

    return id;
  },
});

/**
 * Mark a claimed offer as used
 */
export const markAsUsed = mutation({
  args: {
    user_id: v.id("users"),
    offer_id: v.string(),
    order_id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db
      .query("claimed_offers")
      .withIndex("by_user_offer", (q) =>
        q.eq("user_id", args.user_id).eq("offer_id", args.offer_id)
      )
      .first();

    if (!claim) {
      throw new Error("Claimed offer not found");
    }

    if (claim.is_used) {
      throw new Error("Offer has already been used");
    }

    await ctx.db.patch(claim._id, {
      is_used: true,
      used_at: Date.now(),
      order_id: args.order_id,
    });

    return claim._id;
  },
});

