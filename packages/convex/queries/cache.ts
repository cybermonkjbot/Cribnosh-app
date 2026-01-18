import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const get = internalQuery({
  args: {
    action: v.string(),
    key: v.string(),
    ttlMs: v.optional(v.number()), // Time to live in milliseconds
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("actionCache")
      .withIndex("by_action_key", (q) =>
        q.eq("action", args.action).eq("key", args.key)
      )
      .first();

    if (!cached) return null;

    // Check TTL if provided or if expiresAt is set
    const now = Date.now();

    if (cached.expiresAt && now > cached.expiresAt) {
      return null;
    }

    if (args.ttlMs) {
      const expirationTime = cached.updatedAt + args.ttlMs;
      if (now > expirationTime) {
        return null; // Expired
      }
    }

    return cached.data;
  },
});