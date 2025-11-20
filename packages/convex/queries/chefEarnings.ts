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
    
    // For now, calculate available balance as total earnings minus pending payouts
    // This will be updated when chefPayouts table is implemented
    const pendingPayouts = 0; // TODO: Calculate from chefPayouts table
    const platformFees = Math.round(totalEarnings * 0.15); // 15% platform fee (example)
    const netEarnings = totalEarnings - platformFees;
    const availableBalance = Math.max(0, netEarnings - pendingPayouts);

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

    // TODO: Get from chefEarnings table when implemented
    // For now, return empty array
    return [];
  },
});

