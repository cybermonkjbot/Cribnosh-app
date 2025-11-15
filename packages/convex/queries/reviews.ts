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