// @ts-nocheck
import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory 
} from '../../../apps/web/lib/errors/convex-exports';

// Join a live session (presence tracking)
export const joinSession = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    userId: v.id("users"),
  },
  handler: async (ctx: MutationCtx, { sessionId, userId }) => {
    // Check if user is already in the session
    const existingViewer = await ctx.db
      .query("liveViewers")
      .withIndex("by_session_user", (q) => 
        q.eq("sessionId", sessionId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .first();

    if (existingViewer) {
      // User already in session, update join time
      await ctx.db.patch(existingViewer._id, {
        joinedAt: Date.now(),
      });
      return existingViewer._id;
    }

    // Add new viewer
    const viewerId = await ctx.db.insert("liveViewers", {
      sessionId,
      userId,
      joinedAt: Date.now(),
    });

    // Update session viewer count
    const session = await ctx.db.get(sessionId);
    if (session) {
      await ctx.db.patch(sessionId, {
        currentViewers: (session.currentViewers || 0) + 1,
        viewerCount: (session.viewerCount || 0) + 1,
      });
    }

    return viewerId;
  },
});

// Leave a live session (presence tracking)
export const leaveSession = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    userId: v.id("users"),
  },
  handler: async (ctx: MutationCtx, { sessionId, userId }) => {
    // Find active viewer record
    const viewer = await ctx.db
      .query("liveViewers")
      .withIndex("by_session_user", (q) => 
        q.eq("sessionId", sessionId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .first();

    if (!viewer) {
      return null;
    }

    // Calculate watch duration
    const watchDuration = Math.floor((Date.now() - viewer.joinedAt) / 1000);

    // Mark as left
    await ctx.db.patch(viewer._id, {
      leftAt: Date.now(),
      watchDuration,
    });

    // Update session viewer count
    const session = await ctx.db.get(sessionId);
    if (session) {
      const newCount = Math.max(0, (session.currentViewers || 1) - 1);
      await ctx.db.patch(sessionId, {
        currentViewers: newCount,
      });
    }

    return viewer._id;
  },
});

// Clean up expired presence records (called by cron)
export const cleanupExpiredPresence = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
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