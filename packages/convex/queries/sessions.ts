import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getSessionsByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    
    // Filter out expired sessions
    const activeSessions = sessions.filter(session => session.expiresAt > now);
    
    return activeSessions;
  },
});

 