import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const set = internalMutation({
  args: {
    action: v.string(),
    key: v.string(),
    data: v.any(),
    ttlMs: v.optional(v.number()), // Time to live in milliseconds
  },
  handler: async (ctx: any, args: { action: string; key: string; data: any; ttlMs?: number }) => {
    const expiresAt = args.ttlMs ? Date.now() + args.ttlMs : undefined;

    const existing = await ctx.db
      .query("actionCache")
      .withIndex("by_action_key", (q: any) =>
        q.eq("action", args.action).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        updatedAt: Date.now(),
        expiresAt,
      });
    } else {
      await ctx.db.insert("actionCache", {
        action: args.action,
        key: args.key,
        data: args.data,
        updatedAt: Date.now(),
        expiresAt,
      });
    }
  },
});

export const clear = internalMutation({
  args: {
    action: v.string(),
    key: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("actionCache")
      .withIndex("by_action_key", (q: any) =>
        q.eq("action", args.action).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const cleanup = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();

    // Early exit check - see if any expired entries exist
    const hasExpired = await ctx.db
      .query("actionCache")
      .withIndex("by_expires_at", (q: any) => q.lt("expiresAt", now))
      .first();

    if (!hasExpired) {
      // No expired entries, exit early without logging
      return;
    }

    // Find all expired entries
    const expired = await ctx.db
      .query("actionCache")
      .withIndex("by_expires_at", (q: any) => q.lt("expiresAt", now))
      .collect();

    // Delete them
    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    console.log(`Cleaned up ${expired.length} expired cache entries.`);
  },
});