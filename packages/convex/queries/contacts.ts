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
    
    // Fetch all contacts (will be optimized with index in schema)
    const allContacts = await ctx.db.query('contacts').collect();
    
    // Sort by createdAt desc (newest first)
    allContacts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    // Apply pagination
    if (limit !== undefined) {
      return allContacts.slice(offset, offset + limit);
    }
    
    // If no limit, return all from offset
    return allContacts.slice(offset);
  },
});

// Get total count of contacts (optimized for pagination)
export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const allContacts = await ctx.db.query('contacts').collect();
    return allContacts.length;
  },
}); 