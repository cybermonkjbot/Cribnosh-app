// @ts-nocheck
import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';

/**
 * Convert bytes to base64url encoding (URL-safe base64 without padding)
 * This is more performant and secure than hex encoding:
 * - Shorter tokens (43 chars vs 64 chars for 32 bytes) = 33% reduction in size
 * - URL-safe (can be used in URLs without encoding)
 * - Better entropy per character (6 bits vs 4 bits for hex)
 * - Industry standard (used in JWT, OAuth tokens, etc.)
 */
function toBase64Url(bytes: Uint8Array): string {
  // Convert bytes to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Convert to base64, then to base64url: replace + with -, / with _, and remove padding
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a secure random token using crypto.getRandomValues (available in V8 runtime)
 * Uses base64url encoding for better performance and URL safety
 */
function generateSecureToken(): string {
  // Generate 32 bytes of cryptographically secure random data
  // This provides 256 bits of entropy, which is more than sufficient for session tokens
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Use base64url encoding for better performance and URL safety
  return toBase64Url(array);
}

/**
 * Create a temporary verification session for 2FA
 */
export const createVerificationSession = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.string(), // Returns sessionToken
  handler: async (ctx: MutationCtx, args) => {
    const { userId } = args;
    
    // Generate a secure session token
    const sessionToken = generateSecureToken();
    
    // Session expires in 10 minutes
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Insert verification session
    await ctx.db.insert('verificationSessions', {
      userId,
      sessionToken,
      expiresAt,
      createdAt: Date.now(),
      used: false,
      failedAttempts: 0,
    });
    
    return sessionToken;
  },
});

/**
 * Get verification session by token
 */
export const getVerificationSession = mutation({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      expiresAt: v.number(),
      used: v.boolean(),
      failedAttempts: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx: MutationCtx, args) => {
    const { sessionToken } = args;
    
    const session = await ctx.db
      .query('verificationSessions')
      .withIndex('by_token', (q) => q.eq('sessionToken', sessionToken))
      .first();
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }
    
    return {
      userId: session.userId,
      expiresAt: session.expiresAt,
      used: session.used,
      failedAttempts: session.failedAttempts || 0,
    };
  },
});

/**
 * Mark verification session as used
 */
export const markSessionAsUsed = mutation({
  args: {
    sessionToken: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx: MutationCtx, args) => {
    const { sessionToken } = args;
    
    const session = await ctx.db
      .query('verificationSessions')
      .withIndex('by_token', (q) => q.eq('sessionToken', sessionToken))
      .first();
    
    if (!session) {
      return false;
    }
    
    await ctx.db.patch(session._id, {
      used: true,
    });
    
    return true;
  },
});

/**
 * Increment failed attempts for rate limiting
 */
export const incrementFailedAttempts = mutation({
  args: {
    sessionToken: v.string(),
  },
  returns: v.number(), // Returns new failed attempts count
  handler: async (ctx: MutationCtx, args) => {
    const { sessionToken } = args;
    
    const session = await ctx.db
      .query('verificationSessions')
      .withIndex('by_token', (q) => q.eq('sessionToken', sessionToken))
      .first();
    
    if (!session) {
      return 0;
    }
    
    const newFailedAttempts = (session.failedAttempts || 0) + 1;
    
    await ctx.db.patch(session._id, {
      failedAttempts: newFailedAttempts,
    });
    
    return newFailedAttempts;
  },
});

/**
 * Clean up expired sessions (can be called periodically)
 */
export const cleanupExpiredSessions = mutation({
  args: {},
  returns: v.number(), // Returns number of deleted sessions
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query('verificationSessions')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect();
    
    let deletedCount = 0;
    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
      deletedCount++;
    }
    
    return deletedCount;
  },
});

