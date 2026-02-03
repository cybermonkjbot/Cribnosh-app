// @ts-nocheck
import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { RtcRole } from "../../apps/web/types/livestream";

// Internal: Create a new live session
export const _createSession = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    mealId: v.id("meals"),
    tags: v.array(v.string()),
    channelName: v.string(),
    chefId: v.id("chefs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("liveSessions", {
      session_id: args.channelName,
      chef_id: args.chefId,
      title: args.title,
      description: args.description,
      status: "live",
      scheduled_start_time: Date.now(),
      actual_start_time: Date.now(),
      tags: args.tags,
      viewerCount: 0,
      maxViewers: 1000,
      currentViewers: 0,
      chatEnabled: true,
      totalComments: 0,
      totalReactions: 0,
      mutedUsers: [],
      sessionStats: {
        totalViewers: 0,
        peakViewers: 0,
        averageWatchTime: 0,
        totalTips: 0,
        totalOrders: 0
      },
    });
  },
});

// Internal: Prepare a viewer for a live session
export const _prepareViewer = internalMutation({
  args: { 
    sessionId: v.id("liveSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.status !== "live") {
      throw new Error("This live session has ended");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if viewer already exists
    const existingViewer = await ctx.db
      .query("liveViewers")
      .withIndex("by_session_user", (q) => 
        q.eq("sessionId", session._id)
         .eq("userId", user._id)
      )
      .first();

    if (!existingViewer) {
      // Create new viewer
      await ctx.db.insert("liveViewers", {
        sessionId: session._id,
        userId: user._id,
        joinedAt: Date.now(),
      });

      // Update viewer count
      const newViewerCount = (session.viewerCount || 0) + 1;
      await ctx.db.patch(session._id, {
        viewerCount: newViewerCount,
        currentViewers: session.currentViewers + 1,
        sessionStats: {
          ...session.sessionStats,
          totalViewers: session.sessionStats.totalViewers + 1,
          peakViewers: Math.max(session.sessionStats.peakViewers, newViewerCount),
        },
      });
    }

    return { 
      channelName: session.session_id, 
      userId: user._id.toString() 
    };
  },
});

// Internal: End expired live sessions
export const endExpiredLiveSessions = internalMutation({
  args: {
    maxDurationHours: v.optional(v.number()),
    batchSize: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const maxDurationMs = (args.maxDurationHours || 2) * 60 * 60 * 1000;
    const batchSize = args.batchSize || 50;
    
    // Find sessions that have been active for more than the max duration
    const expiredSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .filter((q) => 
        q.lt(q.field("actual_start_time"), now - maxDurationMs)
      )
      .take(batchSize);
    
    // End each expired session
    for (const session of expiredSessions) {
      await ctx.db.patch(session._id, {
        status: "ended",
        endedAt: now,
        endReason: `Session expired (reached ${args.maxDurationHours || 2} hour limit)`,
      });
      
      // Log the auto-expiration
      await ctx.db.insert("adminLogs", {
        action: "live_session_expired",
        userId: "system" as Id<"users">, // Cast to Id<"users"> to match schema
        adminId: "system" as Id<"users">, // Cast to Id<"users"> to match schema
        details: {
          sessionId: session._id,
          startedAt: session.actual_start_time,
          endedAt: now,
          duration: now - (session.actual_start_time || session.scheduled_start_time),
          maxDurationMs,
        },
        timestamp: now,
      });
    }

    return {
      success: true,
      expiredCount: expiredSessions.length,
    };
  },
});

// Internal: Get session by channel name
export const _getSessionByChannel = internalQuery({
  args: {
    channelName: v.string()
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("liveSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.channelName))
      .first();

    if (!session) {
      return null;
    }

    // Return the session with only the fields we need
    return session;
  },
});
