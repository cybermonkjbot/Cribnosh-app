import { v } from 'convex/values';
import { query, QueryCtx } from '../_generated/server';

// Get cache value (query version for read-only access)
export const getCacheValue = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx: QueryCtx, { key }) => {
    const cacheEntry = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!cacheEntry) {
      return null;
    }

    // Check if expired
    if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
      return null;
    }

    return cacheEntry.value;
  },
});

// Get cache statistics
export const getCacheStats = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const allEntries = await ctx.db.query("cache").collect();
    const now = Date.now();
    
    const stats = {
      total: allEntries.length,
      expired: 0,
      active: 0,
      byPrefix: {} as Record<string, number>,
    };

    for (const entry of allEntries) {
      if (entry.expiresAt && now > entry.expiresAt) {
        stats.expired++;
      } else {
        stats.active++;
      }

      if (entry.prefix) {
        stats.byPrefix[entry.prefix] = (stats.byPrefix[entry.prefix] || 0) + 1;
      }
    }

    return stats;
  },
});

// Get cache entries by prefix
export const getCacheByPrefix = query({
  args: {
    prefix: v.string(),
  },
  handler: async (ctx: QueryCtx, { prefix }) => {
    const now = Date.now();
    
    const entries = await ctx.db
      .query("cache")
      .withIndex("by_prefix", (q) => q.eq("prefix", prefix))
      .collect();

    return entries
      .filter(entry => !entry.expiresAt || now <= entry.expiresAt)
      .map(entry => ({
        key: entry.key,
        value: entry.value,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }));
  },
}); 