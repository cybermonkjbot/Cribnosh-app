import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth } from '../utils/auth';

/**
 * Request a payout
 */
export const requestPayout = mutation({
  args: {
    chefId: v.id('chefs'),
    bankAccountId: v.optional(v.string()), // Will be v.id('chefBankAccounts') when table exists
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

    // TODO: Implement payout request logic when chefPayouts and chefBankAccounts tables exist
    // For now, return a placeholder response
    return {
      payoutId: `payout_${Date.now()}`,
      success: false,
      message: 'Payout requests will be available once bank accounts are set up',
    };
  },
});

