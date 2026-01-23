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
    _id: v.id('chefBankAccounts'), // Return the actual ID
    accountId: v.string(), // Keep for potential virtual/stripe ID if needed, but likely mapped to _id in frontend or ignored
    accountHolderName: v.string(),
    bankName: v.string(),
    last4: v.string(), // Last 4 digits of account
    sortCode: v.optional(v.string()), // Made optional as it's in metadata
    isPrimary: v.boolean(),
    verified: v.boolean(), // We might default this to true or check separate verification status
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

    const accounts = await ctx.db
      .query('chefBankAccounts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .collect();

    return accounts.map(acc => ({
      _id: acc._id,
      accountId: acc._id, // Mapping _id to accountId for compatibility
      accountHolderName: acc.accountHolderName,
      bankName: acc.bankName,
      last4: acc.last4,
      sortCode: acc.metadata?.sortCode,
      isPrimary: acc.isPrimary,
      verified: acc.status === 'active', // Simplified logic
      verifiedAt: acc.updatedAt, // Using updated as proxy for valid status
      createdAt: acc.createdAt,
    }));
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
      _id: v.id('chefBankAccounts'),
      accountId: v.string(),
      accountHolderName: v.string(),
      bankName: v.string(),
      last4: v.string(),
      sortCode: v.optional(v.string()),
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

    const account = await ctx.db
      .query('chefBankAccounts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .filter(q => q.eq(q.field('isPrimary'), true))
      .first();

    if (!account) return null;

    return {
      _id: account._id,
      accountId: account._id,
      accountHolderName: account.accountHolderName,
      bankName: account.bankName,
      last4: account.last4,
      sortCode: account.metadata?.sortCode,
      isPrimary: account.isPrimary,
      verified: account.status === 'active',
      verifiedAt: account.updatedAt,
      createdAt: account.createdAt,
    };
  },
});

