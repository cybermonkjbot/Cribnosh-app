// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const deletion = await ctx.db
      .query('accountDeletions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'processing')
        )
      )
      .first();

    return deletion;
  },
});

