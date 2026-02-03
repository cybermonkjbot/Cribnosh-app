// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('foodSafetySettings')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    return settings;
  },
});

