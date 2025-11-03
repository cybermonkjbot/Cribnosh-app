import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';

// Set cache value
export const setCache = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    ttl: v.optional(v.number()), // Time to live in milliseconds
    prefix: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, { key, value, ttl, prefix }) => {
    const now = Date.now();
    const expiresAt = ttl ? now + ttl : undefined;
    
    // Check if key already exists
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      // Update existing cache entry
      await ctx.db.patch(existing._id, {
        value,
        ttl,
        expiresAt,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new cache entry
      return await ctx.db.insert("cache", {
        key,
        value,
        ttl,
        expiresAt,
        prefix,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get cache value
export const getCache = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx: MutationCtx, { key }) => {
    const cacheEntry = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!cacheEntry) {
      return null;
    }

    // Check if expired
    if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
      // Delete expired entry
      await ctx.db.delete(cacheEntry._id);
      return null;
    }

    return cacheEntry.value;
  },
});

// Delete cache entry
export const deleteCache = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx: MutationCtx, { key }) => {
    const cacheEntry = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (cacheEntry) {
      await ctx.db.delete(cacheEntry._id);
      return true;
    }

    return false;
  },
});

// Clear cache by prefix
export const clearCacheByPrefix = mutation({
  args: {
    prefix: v.string(),
  },
  handler: async (ctx: MutationCtx, { prefix }) => {
    const cacheEntries = await ctx.db
      .query("cache")
      .withIndex("by_prefix", (q) => q.eq("prefix", prefix))
      .collect();

    let deleted = 0;
    for (const entry of cacheEntries) {
      await ctx.db.delete(entry._id);
      deleted++;
    }

    return { deleted };
  },
});

// Clean up expired cache entries
export const cleanupExpiredCache = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
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

// Increment cache value (for counters)
export const incrementCache = mutation({
  args: {
    key: v.string(),
    value: v.optional(v.number()),
    ttl: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, { key, value = 1, ttl }) => {
    const now = Date.now();
    const expiresAt = ttl ? now + ttl : undefined;
    
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      const currentValue = typeof existing.value === 'number' ? existing.value : 0;
      const newValue = currentValue + value;
      
      await ctx.db.patch(existing._id, {
        value: newValue,
        ttl,
        expiresAt,
        updatedAt: now,
      });
      
      return newValue;
    } else {
      const cacheId = await ctx.db.insert("cache", {
        key,
        value,
        ttl,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });
      
      return value;
    }
  },
}); 