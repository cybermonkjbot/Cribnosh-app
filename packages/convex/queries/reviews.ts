// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';

export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit, offset = 0 } = args;
    
    // Fetch all reviews (will be optimized with index in schema)
    const allReviews = await ctx.db.query('reviews').collect();
    
    // Sort by createdAt desc (newest first)
    allReviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    // Apply pagination
    if (limit !== undefined) {
      return allReviews.slice(offset, offset + limit);
    }
    
    // If no limit, return all from offset
    return allReviews.slice(offset);
  }
});

export const getByChef = query({
  args: { chef_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('reviews').filter(q => q.eq(q.field('chef_id'), args.chef_id)).collect();
  },
});

// Get a single review by ID
export const get = query({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get reviews by meal ID
export const getByMealId = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('reviews')
      .filter((q) => q.eq(q.field('mealId'), args.mealId))
      .collect();
  },
});

// Get reviews by user ID (optimized with database index)
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('reviews')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .collect();
  },
});

// Get total count of reviews (optimized for pagination)
export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const allReviews = await ctx.db.query('reviews').collect();
    return allReviews.length;
  },
}); 