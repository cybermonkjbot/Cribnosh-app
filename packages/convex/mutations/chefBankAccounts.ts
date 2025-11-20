import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth } from '../utils/auth';

/**
 * Create a new bank account
 */
export const create = mutation({
  args: {
    chefId: v.id('chefs'),
    accountHolderName: v.string(),
    accountNumber: v.string(),
    sortCode: v.string(), // Format: "XX-XX-XX"
    bankName: v.string(),
    isPrimary: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    accountId: v.string(),
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

    // TODO: Implement bank account creation when chefBankAccounts table exists
    // For now, return a placeholder response
    return {
      accountId: `account_${Date.now()}`,
      success: false,
      message: 'Bank account management will be available soon',
    };
  },
});

/**
 * Update a bank account
 */
export const update = mutation({
  args: {
    accountId: v.string(), // Will be v.id('chefBankAccounts') when table exists
    accountHolderName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.sessionToken);

    // TODO: Implement bank account update when chefBankAccounts table exists
    return {
      success: false,
      message: 'Bank account management will be available soon',
    };
  },
});

/**
 * Delete a bank account
 */
export const remove = mutation({
  args: {
    accountId: v.string(), // Will be v.id('chefBankAccounts') when table exists
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.sessionToken);

    // TODO: Implement bank account deletion when chefBankAccounts table exists
    return {
      success: false,
      message: 'Bank account management will be available soon',
    };
  },
});

/**
 * Set a bank account as primary
 */
export const setPrimary = mutation({
  args: {
    chefId: v.id('chefs'),
    accountId: v.string(), // Will be v.id('chefBankAccounts') when table exists
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
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

    // TODO: Implement set primary when chefBankAccounts table exists
    return {
      success: false,
      message: 'Bank account management will be available soon',
    };
  },
});

