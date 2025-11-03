import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: {
    userId: v.id('users'),
    status: v.optional(
      v.union(v.literal('open'), v.literal('closed'), v.literal('resolved'))
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('supportCases')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    const cases = await query.collect();

    // Filter by status if provided
    const filtered = args.status
      ? cases.filter((c) => c.status === args.status)
      : cases;

    // Sort by created_at descending
    return filtered.sort((a, b) => b.created_at - a.created_at);
  },
});

export const getByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const cases = await ctx.db.query('supportCases').collect();
    return cases.filter((c) => c.order_id === args.orderId);
  },
});

