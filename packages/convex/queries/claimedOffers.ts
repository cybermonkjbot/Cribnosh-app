import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get claimed offer by user and offer ID
 */
export const getByUserAndOffer = query({
  args: {
    user_id: v.id("users"),
    offer_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("claimed_offers")
      .withIndex("by_user_offer", (q) =>
        q.eq("user_id", args.user_id).eq("offer_id", args.offer_id)
      )
      .first();
  },
});

/**
 * Get all claimed offers for a user
 */
export const getByUser = query({
  args: {
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get all claimed offers for user
    const claims = await ctx.db
      .query("claimed_offers")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Filter out expired and return only active claims
    return claims.filter((claim) => claim.expires_at > now);
  },
});

