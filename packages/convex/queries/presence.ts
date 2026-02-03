// @ts-nocheck
import { v } from 'convex/values';
import { query, QueryCtx } from '../_generated/server';

// Real-time presence tracking for live sessions
export const getSessionPresence = query({
  args: { sessionId: v.id("liveSessions") },
  handler: async (ctx: QueryCtx, { sessionId }) => {
    const viewers = await ctx.db
      .query("liveViewers")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .collect();

    return {
      viewerCount: viewers.length,
      viewers: viewers.map(v => ({
        userId: v.userId,
        joinedAt: v.joinedAt
      }))
    };
  },
});

// Get all active sessions with real-time viewer counts
export const getActiveSessions = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const sessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    const sessionsWithPresence = await Promise.all(
      sessions.map(async (session) => {
        const viewers = await ctx.db
          .query("liveViewers")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .filter((q) => q.eq(q.field("leftAt"), undefined))
          .collect();

        return {
          ...session,
          currentViewers: viewers.length,
          viewerCount: viewers.length
        };
      })
    );

    return sessionsWithPresence;
  },
});

// Get user's active sessions (for presence tracking)
export const getUserActiveSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx: QueryCtx, { userId }) => {
    const viewerSessions = await ctx.db
      .query("liveViewers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .collect();

    return viewerSessions.map(vs => vs.sessionId);
  },
}); 