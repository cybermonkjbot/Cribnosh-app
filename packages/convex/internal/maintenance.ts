import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const cleanupExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Early exit check - see if any expired entries exist
    const hasExpired = await ctx.db
      .query("cache")
      .withIndex("by_expiry", (q) => q.lte("expiresAt", now))
      .first();

    if (!hasExpired) {
      return { deleted: 0 };
    }

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

    // Early exit check - see if any expired sessions exist
    const hasExpired = await ctx.db
      .query("sessionStorage")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .first();

    if (!hasExpired) {
      return { deleted: 0 };
    }

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

    // Early exit check - see if any old jobs exist
    const hasOldJobs = await ctx.db
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
      .first();

    if (!hasOldJobs) {
      return { deleted: 0 };
    }

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

    // Early exit check - see if any expired viewers exist
    const hasExpired = await ctx.db
      .query("liveViewers")
      .filter((q) =>
        q.and(
          q.neq(q.field("leftAt"), undefined),
          q.lt(q.field("leftAt"), cutoffTime)
        )
      )
      .first();

    if (!hasExpired) {
      return { cleaned: 0 };
    }

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

export const cleanupEndedLiveSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeMinutesAgo = now - (3 * 60 * 1000); // 3 minutes ago

    // Early exit check - see if any ended sessions need cleanup
    const hasEndedSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "ended"))
      .filter((q) =>
        q.and(
          q.neq(q.field("endedAt"), undefined),
          q.lt(q.field("endedAt"), threeMinutesAgo)
        )
      )
      .first();

    if (!hasEndedSessions) {
      return {
        deletedSessions: 0,
        deletedComments: 0,
        deletedReactions: 0,
        deletedViewers: 0,
      };
    }

    // Find all ended livestreams that ended 3+ minutes ago
    // Query by status index first, then filter by endedAt
    const endedSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "ended"))
      .filter((q) =>
        q.and(
          q.neq(q.field("endedAt"), undefined),
          q.lt(q.field("endedAt"), threeMinutesAgo)
        )
      )
      .collect();

    let deletedSessions = 0;
    let deletedComments = 0;
    let deletedReactions = 0;
    let deletedViewers = 0;

    for (const session of endedSessions) {
      const sessionId = session._id;

      // Delete related liveComments
      const comments = await ctx.db
        .query("liveComments")
        .withIndex("by_session", (q) => q.eq("session_id", sessionId))
        .collect();

      for (const comment of comments) {
        await ctx.db.delete(comment._id);
        deletedComments++;
      }

      // Delete related liveReactions
      const reactions = await ctx.db
        .query("liveReactions")
        .withIndex("by_session", (q) => q.eq("session_id", sessionId))
        .collect();

      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
        deletedReactions++;
      }

      // Delete related liveViewers
      const viewers = await ctx.db
        .query("liveViewers")
        .withIndex("by_session", (q: any) => q.eq("sessionId", sessionId))
        .collect();

      for (const viewer of viewers) {
        await ctx.db.delete(viewer._id);
        deletedViewers++;
      }

      // Finally, delete the session itself
      await ctx.db.delete(sessionId);
      deletedSessions++;
    }

    return {
      deletedSessions,
      deletedComments,
      deletedReactions,
      deletedViewers,
    };
  },
});

// Helper function to delete a session and all related data
async function deleteSessionAndRelatedData(
  ctx: any,
  sessionId: any,
  deleteSession: boolean = true
): Promise<{ comments: number; reactions: number; viewers: number }> {
  let deletedComments = 0;
  let deletedReactions = 0;
  let deletedViewers = 0;

  // Delete related liveComments
  const comments = await ctx.db
    .query("liveComments")
    .withIndex("by_session", (q: any) => q.eq("session_id", sessionId))
    .collect();

  for (const comment of comments) {
    await ctx.db.delete(comment._id);
    deletedComments++;
  }

  // Delete related liveReactions
  const reactions = await ctx.db
    .query("liveReactions")
    .withIndex("by_session", (q: any) => q.eq("session_id", sessionId))
    .collect();

  for (const reaction of reactions) {
    await ctx.db.delete(reaction._id);
    deletedReactions++;
  }

  // Delete related liveViewers
  const viewers = await ctx.db
    .query("liveViewers")
    .withIndex("by_session", (q: any) => q.eq("sessionId", sessionId))
    .collect();

  for (const viewer of viewers) {
    await ctx.db.delete(viewer._id);
    deletedViewers++;
  }

  // Delete the session itself if requested
  if (deleteSession) {
    await ctx.db.delete(sessionId);
  }

  return { comments: deletedComments, reactions: deletedReactions, viewers: deletedViewers };
}

export const cleanupOrphanedLiveSessions = internalMutation({
  args: {
    olderThanHours: v.optional(v.number()),
  },
  handler: async (ctx, { olderThanHours = 24 }) => {
    const now = Date.now();
    const cutoffTime = now - (olderThanHours * 60 * 60 * 1000); // Default: 24 hours ago

    // Early exit check - see if any ended or live sessions exist at all
    const hasEndedSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "ended"))
      .first();

    const hasLiveSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .first();

    if (!hasEndedSessions && !hasLiveSessions) {
      return {
        deletedSessions: 0,
        deletedComments: 0,
        deletedReactions: 0,
        deletedViewers: 0,
      };
    }

    let deletedSessions = 0;
    let deletedComments = 0;
    let deletedReactions = 0;
    let deletedViewers = 0;

    // Find orphaned ended sessions:
    // 1. Sessions with status "ended" that have endedAt older than cutoff (should have been cleaned up)
    // 2. Sessions with status "ended" that don't have endedAt but are old (orphaned)
    // 3. Sessions with status "live" that haven't been updated in a long time (stuck sessions)

    // Get all ended sessions
    const allEndedSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "ended"))
      .collect();

    // Get all live sessions that might be stuck
    const allLiveSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    // Process ended sessions
    for (const session of allEndedSessions) {
      const sessionStartTime = session.actual_start_time || session.scheduled_start_time || session._creationTime;
      const sessionEndTime = session.endedAt || sessionStartTime;

      // Check if session is old enough to be considered orphaned
      const isOrphaned =
        // Case 1: Has endedAt but it's older than cutoff (should have been cleaned up)
        (session.endedAt && session.endedAt < cutoffTime) ||
        // Case 2: No endedAt but session is old (orphaned)
        (!session.endedAt && sessionStartTime < cutoffTime);

      if (isOrphaned) {
        const result = await deleteSessionAndRelatedData(ctx, session._id);
        deletedSessions++;
        deletedComments += result.comments;
        deletedReactions += result.reactions;
        deletedViewers += result.viewers;
      }
    }

    // Process potentially stuck live sessions (older than cutoff and no recent activity)
    for (const session of allLiveSessions) {
      const sessionStartTime = session.actual_start_time || session.scheduled_start_time || session._creationTime;

      // If session started more than cutoff time ago and has no viewers, consider it stuck
      if (sessionStartTime < cutoffTime && (session.viewerCount === 0 || session.currentViewers === 0)) {
        // Delete directly (no need to mark as ended first since we're deleting it)
        const result = await deleteSessionAndRelatedData(ctx, session._id, true);
        deletedSessions++;
        deletedComments += result.comments;
        deletedReactions += result.reactions;
        deletedViewers += result.viewers;
      }
    }

    return {
      deletedSessions,
      deletedComments,
      deletedReactions,
      deletedViewers,
    };
  },
});