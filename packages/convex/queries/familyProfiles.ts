import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('familyProfiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    return profile;
  },
});

