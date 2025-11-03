import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query('customerBalances')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!balance) {
      // Return default balance if none exists
      return {
        balance: 0,
        currency: 'GBP',
        is_available: true,
        last_updated: new Date().toISOString(),
      };
    }

    return {
      balance: balance.balance,
      currency: balance.currency,
      is_available: balance.is_available,
      last_updated: new Date(balance.last_updated).toISOString(),
    };
  },
});

export const getTransactions = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allTransactions = await ctx.db
      .query('balanceTransactions')
      .withIndex('by_user_date', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    const limit = args.limit || 20;
    const offset = args.offset || 0;
    const transactions = allTransactions.slice(offset, offset + limit);

    return transactions.map((tx) => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      created_at: new Date(tx.createdAt).toISOString(),
      status: tx.status,
    }));
  },
});

