// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const paymentMethods = await ctx.db
      .query('paymentMethods')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    return paymentMethods.map((pm) => ({
      id: pm._id,
      type: pm.type,
      is_default: pm.is_default,
      last4: pm.last4 || null,
      brand: pm.brand || null,
      exp_month: pm.exp_month || null,
      exp_year: pm.exp_year || null,
      created_at: new Date(pm.createdAt).toISOString(),
    }));
  },
});

export const getById = query({
  args: {
    paymentMethodId: v.id('paymentMethods'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const paymentMethod = await ctx.db.get(args.paymentMethodId);
    if (!paymentMethod || paymentMethod.userId !== args.userId) {
      return null;
    }
    return paymentMethod;
  },
});

