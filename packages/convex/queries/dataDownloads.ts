import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getRecentByUserId = query({
  args: {
    userId: v.id('users'),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.hours * 60 * 60 * 1000;
    const downloads = await ctx.db
      .query('dataDownloads')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gt(q.field('requested_at'), cutoff))
      .collect();

    return downloads;
  },
});

