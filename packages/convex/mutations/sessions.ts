import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory 
} from '../../../apps/web/lib/errors/convex-exports';

// Create or update session
export const setSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.id("users"),
    data: v.any(),
    ttl: v.optional(v.number()), // Time to live in milliseconds
  },
  handler: async (ctx: MutationCtx, { sessionId, userId, data, ttl = 24 * 60 * 60 * 1000 }) => {
    const now = Date.now();
    const expiresAt = now + ttl;
    
    // Check if session already exists
    const existing = await ctx.db
      .query("sessionStorage")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existing) {
      // Update existing session
      await ctx.db.patch(existing._id, {
        data,
        expiresAt,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new session
      return await ctx.db.insert("sessionStorage", {
        sessionId,
        userId,
        data,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get session data
export const getSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx: MutationCtx, { sessionId }) => {
    const session = await ctx.db
      .query("sessionStorage")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (!session) {
      return null;
    }

    // Check if expired
    if (Date.now() > session.expiresAt) {
      // Delete expired session
      await ctx.db.delete(session._id);
      return null;
    }

    return {
      userId: session.userId,
      data: session.data,
      expiresAt: session.expiresAt,
    };
  },
});

// Delete session
export const deleteSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx: MutationCtx, { sessionId }) => {
    const session = await ctx.db
      .query("sessionStorage")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
      return true;
    }

    return false;
  },
});

// Get all sessions for a user
export const getUserSessions = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx: MutationCtx, { userId }) => {
    const now = Date.now();
    
    const sessions = await ctx.db
      .query("sessionStorage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const activeSessions = sessions.filter(session => session.expiresAt > now);
    
    return activeSessions.map(session => ({
      sessionId: session.sessionId,
      data: session.data,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    }));
  },
});

// Clean up expired sessions
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
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

// Extend session TTL
export const extendSession = mutation({
  args: {
    sessionId: v.string(),
    ttl: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, { sessionId, ttl = 24 * 60 * 60 * 1000 }) => {
    const session = await ctx.db
      .query("sessionStorage")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (!session) {
      return false;
    }

    const now = Date.now();
    const newExpiresAt = now + ttl;

    await ctx.db.patch(session._id, {
      expiresAt: newExpiresAt,
      updatedAt: now,
    });

    return true;
  },
}); 