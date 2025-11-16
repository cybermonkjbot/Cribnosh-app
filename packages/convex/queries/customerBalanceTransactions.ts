import { query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Get balance transactions by user ID with pagination
 */
export const getByUserId = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get transactions ordered by creation date (newest first)
    const allTransactions = await ctx.db
      .query('balanceTransactions')
      .withIndex('by_user_date', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    // Apply pagination
    const transactions = allTransactions.slice(offset, offset + limit);

    return transactions.map((tx) => ({
      _id: tx._id,
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      status: tx.status,
      order_id: tx.order_id,
      reference: tx.reference,
      createdAt: tx.createdAt,
    }));
  },
});

/**
 * Get total count of balance transactions by user ID
 */
export const getCountByUserId = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('balanceTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    return transactions.length;
  },
});

