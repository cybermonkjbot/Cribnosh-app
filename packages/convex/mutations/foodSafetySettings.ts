import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const updateCrossContamination = mutation({
  args: {
    userId: v.id('users'),
    avoid_cross_contamination: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('foodSafetySettings')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        avoid_cross_contamination: args.avoid_cross_contamination,
        updated_at: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert('foodSafetySettings', {
        userId: args.userId,
        avoid_cross_contamination: args.avoid_cross_contamination,
        updated_at: Date.now(),
      });
    }
  },
});

