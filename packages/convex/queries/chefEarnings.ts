import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../utils/auth';

/**
 * Get earnings summary for a chef
 * Returns available balance, pending payouts, and total earnings
 */
export const getSummary = query({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    totalEarnings: v.number(), // in pence
    availableBalance: v.number(), // in pence
    pendingPayouts: v.number(), // in pence
    platformFees: v.number(), // in pence
    netEarnings: v.number(), // in pence
  }),
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

    // Get earnings from chef's performance data or cached values
    const totalEarnings = chef.performance?.totalEarnings || 0;

    // Calculate pending payouts
    const payouts = await ctx.db
      .query('chefPayouts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .filter(q => q.eq(q.field('status'), 'requested') || q.eq(q.field('status'), 'processing'))
      .collect();

    const pendingPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

    // Calculate all-time paid outs
    const paidPayouts = await ctx.db
      .query('chefPayouts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .filter(q => q.eq(q.field('status'), 'paid'))
      .collect();

    const totalPaidOut = paidPayouts.reduce((sum, p) => sum + p.amount, 0);

    const platformFees = Math.round(totalEarnings * 0.15); // 15% platform fee (example)
    const netEarnings = totalEarnings - platformFees;

    // Available balance is Net Earnings - (Pending + Paid)
    const availableBalance = Math.max(0, netEarnings - pendingPayouts - totalPaidOut);

    return {
      totalEarnings,
      availableBalance,
      pendingPayouts,
      platformFees,
      netEarnings,
    };
  },
});

/**
 * Get recent earnings transactions
 */
export const getTransactions = query({
  args: {
    chefId: v.id('chefs'),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(v.object({
    transactionId: v.string(),
    type: v.union(
      v.literal('earning'),
      v.literal('payout'),
      v.literal('fee'),
      v.literal('refund')
    ),
    amount: v.number(), // in pence
    date: v.number(),
    description: v.string(),
    orderId: v.optional(v.string()),
  })),
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

    const limit = args.limit || 20;

    // Get payouts
    const payouts = await ctx.db
      .query('chefPayouts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .order('desc')
      .take(limit);

    // Map payouts to transaction format
    const transactions = payouts.map(p => ({
      transactionId: p._id,
      type: 'payout' as const,
      amount: -p.amount, // Negative for payouts
      date: p.requestedAt,
      description: `Payout to ${p.bankAccountId ? 'Bank Account' : 'Account'}`, // Simplified description
      // In a real app we'd fetch the bank account details to be more specific
    }));

    // TODO: Merge with order earnings (requires querying orders/payments)

    return transactions;
  },
});

