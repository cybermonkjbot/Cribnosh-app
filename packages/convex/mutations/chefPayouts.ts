import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { mutation } from '../_generated/server';
import { requireAuth } from '../utils/auth';

/**
 * Request a payout
 */
export const requestPayout = mutation({
  args: {
    chefId: v.id('chefs'),
    bankAccountId: v.id('chefBankAccounts'), // Updated to use correct ID
    amount: v.optional(v.number()), // in pence, if not provided, uses all available
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    payoutId: v.string(),
    success: v.boolean(),
    message: v.string(),
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

    // Check for insufficient funds
    const totalEarnings = chef.performance?.totalEarnings || 0;
    const platformFees = Math.round(totalEarnings * 0.15);
    const netEarnings = totalEarnings - platformFees;

    // Calculate pending payouts
    const payouts = await ctx.db
      .query('chefPayouts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .filter(q => q.neq(q.field('status'), 'failed') && q.neq(q.field('status'), 'cancelled'))
      .collect();

    const totalPendingOrPaid = payouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = Math.max(0, netEarnings - totalPendingOrPaid);

    // Default to full balance if no amount specified
    const requestAmount = args.amount || availableBalance;

    if (requestAmount <= 0) {
      return {
        payoutId: '',
        success: false,
        message: 'No funds available for payout',
      };
    }

    if (requestAmount > availableBalance) {
      return {
        payoutId: '',
        success: false,
        message: 'Requested amount exceeds available balance',
      };
    }

    const now = Date.now();
    const payoutId = await ctx.db.insert('chefPayouts', {
      chefId: args.chefId,
      bankAccountId: args.bankAccountId as Id<'chefBankAccounts'>, // Start assuming this is a valid ID now
      amount: requestAmount,
      currency: 'gbp',
      status: 'requested',
      requestedAt: now,
    });

    return {
      payoutId,
      success: true,
      message: 'Payout request initiated successfully',
    };
  },
});

