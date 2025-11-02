import { v } from 'convex/values';
import { query } from '../_generated/server';

/**
 * Get Nosh Points by user ID
 */
export const getPointsByUserId = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const pointsRecord = await ctx.db
      .query('noshPoints')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!pointsRecord) {
      return {
        available_points: 0,
        total_points_earned: 0,
        total_points_spent: 0,
      };
    }

    return {
      available_points: pointsRecord.available_points,
      total_points_earned: pointsRecord.total_points_earned,
      total_points_spent: pointsRecord.total_points_spent,
      last_updated: new Date(pointsRecord.updated_at).toISOString(),
    };
  },
});

/**
 * Get Nosh Point transactions by user ID with pagination
 */
export const getTransactionsByUserId = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const cursor = args.cursor;
    
    let query = ctx.db
      .query('noshPointTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    if (cursor !== undefined && typeof cursor === 'number') {
      query = query.filter((q) => q.lt(q.field('created_at'), cursor));
    }

    const transactions = await query
      .order('desc')
      .take(limit);

    return transactions.map(t => ({
      points: t.points,
      type: t.type,
      reason: t.reason,
      order_id: t.order_id,
      created_at: new Date(t.created_at).toISOString(),
    }));
  },
});

