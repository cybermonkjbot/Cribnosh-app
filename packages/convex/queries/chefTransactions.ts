import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../utils/auth';

/**
 * Get transactions for a chef with filtering and pagination
 */
export const getByChefId = query({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal('earning'),
      v.literal('payout'),
      v.literal('fee'),
      v.literal('refund'),
      v.literal('all')
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }

    // Verify ownership
    if (chef.userId !== user._id) {
      throw new Error('Access denied');
    }

    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get all transactions for the chef's user ID
    let transactions = await ctx.db
      .query('balanceTransactions')
      .withIndex('by_user_date', (q) => q.eq('userId', chef.userId))
      .order('desc')
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      transactions = transactions.filter(tx => tx.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      transactions = transactions.filter(tx => tx.createdAt <= args.endDate!);
    }

    // Filter by type if provided
    if (args.type && args.type !== 'all') {
      // Map transaction types
      // earning = credit with positive amount
      // payout = debit with negative amount (payout)
      // fee = debit with negative amount (fee)
      // refund = credit (refund)
      transactions = transactions.filter(tx => {
        if (args.type === 'earning') {
          return tx.type === 'credit' && tx.amount > 0 && !tx.description.toLowerCase().includes('refund');
        } else if (args.type === 'payout') {
          return tx.type === 'debit' && tx.description.toLowerCase().includes('payout');
        } else if (args.type === 'fee') {
          return tx.type === 'debit' && (tx.description.toLowerCase().includes('fee') || tx.description.toLowerCase().includes('commission'));
        } else if (args.type === 'refund') {
          return tx.description.toLowerCase().includes('refund');
        }
        return true;
      });
    }

    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    return {
      transactions: paginatedTransactions.map((tx) => ({
        _id: tx._id,
        type: tx.type === 'credit' && tx.amount > 0 && !tx.description.toLowerCase().includes('refund') 
          ? 'earning' as const
          : tx.type === 'debit' && tx.description.toLowerCase().includes('payout')
          ? 'payout' as const
          : tx.type === 'debit' && (tx.description.toLowerCase().includes('fee') || tx.description.toLowerCase().includes('commission'))
          ? 'fee' as const
          : 'refund' as const,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        status: tx.status,
        order_id: tx.order_id,
        reference: tx.reference,
        createdAt: tx.createdAt,
      })),
      total: transactions.length,
      hasMore: offset + limit < transactions.length,
    };
  },
});

/**
 * Get transaction count by type for a chef
 */
export const getCountByType = query({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }

    // Verify ownership
    if (chef.userId !== user._id) {
      throw new Error('Access denied');
    }

    const transactions = await ctx.db
      .query('balanceTransactions')
      .withIndex('by_user', (q) => q.eq('userId', chef.userId))
      .collect();

    const counts = {
      all: transactions.length,
      earning: transactions.filter(tx => tx.type === 'credit' && tx.amount > 0 && !tx.description.toLowerCase().includes('refund')).length,
      payout: transactions.filter(tx => tx.type === 'debit' && tx.description.toLowerCase().includes('payout')).length,
      fee: transactions.filter(tx => tx.type === 'debit' && (tx.description.toLowerCase().includes('fee') || tx.description.toLowerCase().includes('commission'))).length,
      refund: transactions.filter(tx => tx.description.toLowerCase().includes('refund')).length,
    };

    return counts;
  },
});

