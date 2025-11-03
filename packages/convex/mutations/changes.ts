import { v } from 'convex/values';
import { mutation } from '../_generated/server';

// Insert a new change event for real-time broadcasting
export const insert = mutation({
  args: {
    type: v.string(),
    data: v.any(),
    synced: v.boolean(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('changes', {
      type: args.type,
      data: args.data,
      synced: args.synced,
      timestamp: args.timestamp,
    });
    return id;
  },
}); 