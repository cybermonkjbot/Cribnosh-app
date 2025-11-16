import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getSessionsByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Get ALL sessions for the user (don't filter here - let the caller decide)
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    
    return sessions;
  },
});

 