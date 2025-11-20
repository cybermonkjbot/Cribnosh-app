import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../utils/auth';

/**
 * Get all bank accounts for a chef
 */
export const getByChefId = query({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(v.object({
    accountId: v.string(),
    accountHolderName: v.string(),
    bankName: v.string(),
    last4: v.string(), // Last 4 digits of account
    sortCode: v.string(), // Format: "XX-XX-XX"
    isPrimary: v.boolean(),
    verified: v.boolean(),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
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

    // TODO: Query chefBankAccounts table when implemented
    // For now, return empty array
    return [];
  },
});

/**
 * Get primary bank account for a chef
 */
export const getPrimary = query({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      accountId: v.string(),
      accountHolderName: v.string(),
      bankName: v.string(),
      last4: v.string(),
      sortCode: v.string(),
      isPrimary: v.boolean(),
      verified: v.boolean(),
      verifiedAt: v.optional(v.number()),
      createdAt: v.number(),
    }),
    v.null()
  ),
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

    // TODO: Query chefBankAccounts table when implemented
    return null;
  },
});

