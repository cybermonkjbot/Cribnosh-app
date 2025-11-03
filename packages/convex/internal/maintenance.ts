import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const cleanupExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredEntries = await ctx.db
      .query("cache")
      .withIndex("by_expiry", (q) => q.lte("expiresAt", now))
      .collect();

    let deleted = 0;
    for (const entry of expiredEntries) {
      await ctx.db.delete(entry._id);
      deleted++;
    }

    return { deleted };
  },
});

export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredSessions = await ctx.db
      .query("sessionStorage")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();

    let deleted = 0;
    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
      deleted++;
    }

    return { deleted };
  },
});

export const retryFailedJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const failedJobs = await ctx.db
      .query("jobQueue")
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();

    let retried = 0;
    for (const job of failedJobs) {
      // Reset job status and increment retry count
      await ctx.db.patch(job._id, {
        status: "pending",
        retryCount: (job.retryCount || 0) + 1,
        lastRetryAt: Date.now(),
      });
      retried++;
    }

    return { retried };
  },
});

export const cleanupOldJobs = internalMutation({
  args: {
    olderThanMs: v.optional(v.number()),
  },
  handler: async (ctx, { olderThanMs = 7 * 24 * 60 * 60 * 1000 }) => {
    const cutoffTime = Date.now() - olderThanMs;
    
    const oldJobs = await ctx.db
      .query("jobQueue")
      .filter((q) => 
        q.and(
          q.or(
            q.eq(q.field("status"), "completed"),
            q.eq(q.field("status"), "failed")
          ),
          q.lt(q.field("createdAt"), cutoffTime)
        )
      )
      .collect();

    let deleted = 0;
    for (const job of oldJobs) {
      await ctx.db.delete(job._id);
      deleted++;
    }

    return { deleted };
  },
});

export const cleanupExpiredPresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const expiredViewers = await ctx.db
      .query("liveViewers")
      .filter((q) => 
        q.and(
          q.neq(q.field("leftAt"), undefined),
          q.lt(q.field("leftAt"), cutoffTime)
        )
      )
      .collect();

    // Delete expired records
    for (const viewer of expiredViewers) {
      await ctx.db.delete(viewer._id);
    }

    return { cleaned: expiredViewers.length };
  },
});