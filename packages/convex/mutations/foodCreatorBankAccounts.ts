// @ts-nocheck
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

    // Check if this is the first account
    const existingAccounts = await ctx.db
      .query('chefBankAccounts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .collect();

    let isPrimary = args.isPrimary || false;
    if (existingAccounts.length === 0) {
      isPrimary = true;
    }

    // If setting as primary, unset others
    if (isPrimary && existingAccounts.length > 0) {
      for (const acc of existingAccounts) {
        if (acc.isPrimary) {
          await ctx.db.patch(acc._id, { isPrimary: false });
        }
      }
    }

    const last4 = args.accountNumber.slice(-4);

    const accountId = await ctx.db.insert('chefBankAccounts', {
      chefId: args.chefId,
      accountHolderName: args.accountHolderName,
      bankName: args.bankName,
      last4,
      isPrimary,
      status: 'active',
      metadata: {
        accountNumber: args.accountNumber,
        sortCode: args.sortCode,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      accountId,
      success: true,
      message: 'Bank account added successfully',
    };
  },
});

/**
 * Update a bank account
 */
export const update = mutation({
  args: {
    accountId: v.id('chefBankAccounts'),
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
    const user = await requireAuth(ctx, args.sessionToken);

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error('Account not found');

    const chef = await ctx.db.get(account.chefId);
    if (!chef) throw new Error('Chef not found');

    // Verify ownership
    if (chef.userId !== user._id) {
      throw new Error('Access denied');
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.accountHolderName !== undefined) updates.accountHolderName = args.accountHolderName;
    if (args.bankName !== undefined) updates.bankName = args.bankName;

    // Handle primary status change
    if (args.isPrimary && !account.isPrimary) {
      // Unset other primary accounts
      const existingAccounts = await ctx.db
        .query('chefBankAccounts')
        .withIndex('by_chef', q => q.eq('chefId', account.chefId))
        .collect();

      for (const acc of existingAccounts) {
        if (acc.isPrimary && acc._id !== args.accountId) {
          await ctx.db.patch(acc._id, { isPrimary: false });
        }
      }
      updates.isPrimary = true;
    }

    await ctx.db.patch(args.accountId, updates);

    return {
      success: true,
      message: 'Bank account updated successfully',
    };
  },
});

/**
 * Delete a bank account
 */
export const remove = mutation({
  args: {
    accountId: v.id('chefBankAccounts'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error('Account not found');

    const chef = await ctx.db.get(account.chefId);
    if (!chef) throw new Error('Chef not found');

    // Verify ownership
    if (chef.userId !== user._id) {
      throw new Error('Access denied');
    }

    // Prevent deleting primary account if others exist
    if (account.isPrimary) {
      const existingAccounts = await ctx.db
        .query('chefBankAccounts')
        .withIndex('by_chef', q => q.eq('chefId', account.chefId))
        .collect();

      if (existingAccounts.length > 1) {
        throw new Error('Cannot delete primary account. Please set another account as primary first.');
      }
    }

    await ctx.db.delete(args.accountId);

    return {
      success: true,
      message: 'Bank account removed successfully',
    };
  },
});

/**
 * Set a bank account as primary
 */
export const setPrimary = mutation({
  args: {
    chefId: v.id('chefs'),
    accountId: v.id('chefBankAccounts'),
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

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error('Account not found');
    if (account.chefId !== args.chefId) throw new Error('Account does not belong to this chef');

    if (account.isPrimary) {
      return { success: true, message: 'Already primary' };
    }

    // Unset other primary accounts
    const existingAccounts = await ctx.db
      .query('chefBankAccounts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .collect();

    for (const acc of existingAccounts) {
      if (acc.isPrimary) {
        await ctx.db.patch(acc._id, { isPrimary: false });
      }
    }

    await ctx.db.patch(args.accountId, { isPrimary: true });

    return {
      success: true,
      message: 'Primary account updated successfully',
    };
  },
});

