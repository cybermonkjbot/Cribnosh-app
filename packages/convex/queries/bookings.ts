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