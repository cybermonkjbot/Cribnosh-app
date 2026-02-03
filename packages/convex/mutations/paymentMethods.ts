// @ts-nocheck
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

export const create = mutation({
  args: {
    userId: v.id('users'),
    payment_method_id: v.string(),
    type: v.union(v.literal('card'), v.literal('apple_pay'), v.literal('google_pay')),
    set_as_default: v.boolean(),
    last4: v.optional(v.string()),
    brand: v.optional(v.string()),
    exp_month: v.optional(v.number()),
    exp_year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // If setting as default, unset other defaults
    if (args.set_as_default) {
      const existingDefaults = await ctx.db
        .query('paymentMethods')
        .withIndex('by_user_default', (q) =>
          q.eq('userId', args.userId).eq('is_default', true)
        )
        .collect();

      for (const pm of existingDefaults) {
        await ctx.db.patch(pm._id, { is_default: false });
      }
    }

    const paymentMethodId = await ctx.db.insert('paymentMethods', {
      userId: args.userId,
      payment_method_id: args.payment_method_id,
      type: args.type,
      is_default: args.set_as_default,
      last4: args.last4,
      brand: args.brand,
      exp_month: args.exp_month,
      exp_year: args.exp_year,
      status: 'active',
      createdAt: Date.now(),
    });

    return paymentMethodId;
  },
});

export const setDefault = mutation({
  args: {
    paymentMethodId: v.id('paymentMethods'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Verify payment method belongs to user
    const paymentMethod = await ctx.db.get(args.paymentMethodId);
    if (!paymentMethod || paymentMethod.userId !== args.userId) {
      throw new Error('Payment method not found');
    }

    // Unset other defaults
    const existingDefaults = await ctx.db
      .query('paymentMethods')
      .withIndex('by_user_default', (q) =>
        q.eq('userId', args.userId).eq('is_default', true)
      )
      .collect();

    for (const pm of existingDefaults) {
      if (pm._id !== args.paymentMethodId) {
        await ctx.db.patch(pm._id, { is_default: false, updatedAt: Date.now() });
      }
    }

    // Set this as default
    await ctx.db.patch(args.paymentMethodId, {
      is_default: true,
      updatedAt: Date.now(),
    });

    return args.paymentMethodId;
  },
});

export const remove = mutation({
  args: {
    paymentMethodId: v.id('paymentMethods'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Verify payment method belongs to user
    const paymentMethod = await ctx.db.get(args.paymentMethodId);
    if (!paymentMethod || paymentMethod.userId !== args.userId) {
      throw new Error('Payment method not found');
    }

    // If this was the default, set another one as default if available
    if (paymentMethod.is_default) {
      const otherMethods = await ctx.db
        .query('paymentMethods')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .filter((q) => q.neq(q.field('_id'), args.paymentMethodId))
        .collect();

      if (otherMethods.length > 0) {
        // Set the first available method as default
        await ctx.db.patch(otherMethods[0]._id, {
          is_default: true,
          updatedAt: Date.now(),
        });
      }
    }

    // Delete the payment method
    await ctx.db.delete(args.paymentMethodId);

    return args.paymentMethodId;
  },
});

