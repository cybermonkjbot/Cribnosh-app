import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getSessionsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('sessions')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
    
    return sessions;
  },
});

 