// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit, offset = 0 } = args;
    
    // Fetch all bookings (will be optimized with index in schema if needed)
    const allBookings = await ctx.db.query('bookings').collect();
    
    // Sort by creation time desc (newest first)
    allBookings.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));
    
    // Apply pagination
    if (limit !== undefined) {
      return allBookings.slice(offset, offset + limit);
    }
    
    // If no limit, return all from offset
    return allBookings.slice(offset);
  }
});

// Get booking by user ID and meal ID (for review validation)
export const getByUserIdAndMealId = query({
  args: {
    userId: v.id('users'),
    mealId: v.id('meals'),
  },
  handler: async (ctx, args) => {
    // Filter by user_id at database level if possible
    const userBookings = await ctx.db
      .query('bookings')
      .filter((q) => q.eq(q.field('user_id'), args.userId))
      .collect();
    
    // Filter by meal_id in memory (meal_id may not be in schema, but check if it exists)
    return userBookings.find((b: any) => (b as any).meal_id === args.mealId) || null;
  },
}); 