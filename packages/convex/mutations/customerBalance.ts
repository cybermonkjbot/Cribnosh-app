import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const createOrUpdate = mutation({
  args: {
    userId: v.id('users'),
    balance: v.number(),
    currency: v.string(),
    is_available: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('customerBalances')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        balance: args.balance,
        currency: args.currency,
        is_available: args.is_available,
        last_updated: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert('customerBalances', {
        userId: args.userId,
        balance: args.balance,
        currency: args.currency,
        is_available: args.is_available,
        last_updated: Date.now(),
      });
    }
  },
});

export const addTransaction = mutation({
  args: {
    userId: v.id('users'),
    type: v.union(v.literal('credit'), v.literal('debit')),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    status: v.union(v.literal('pending'), v.literal('completed'), v.literal('failed')),
    order_id: v.optional(v.id('orders')),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create transaction
    const transactionId = await ctx.db.insert('balanceTransactions', {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      status: args.status,
      order_id: args.order_id,
      reference: args.reference,
      createdAt: Date.now(),
    });

    // Update balance if transaction is completed
    if (args.status === 'completed') {
      const balance = await ctx.db
        .query('customerBalances')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .first();

      if (balance) {
        const newBalance = balance.balance + args.amount;
        await ctx.db.patch(balance._id, {
          balance: newBalance,
          last_updated: Date.now(),
        });
      } else {
        // Create balance if it doesn't exist
        await ctx.db.insert('customerBalances', {
          userId: args.userId,
          balance: args.amount,
          currency: args.currency,
          is_available: true,
          last_updated: Date.now(),
        });
      }
    }

    return transactionId;
  },
});

