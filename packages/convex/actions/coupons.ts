"use node";

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { api } from '../_generated/api';

/**
 * Validate and apply coupon code (for mobile app)
 */
export const validateAndApplyCoupon = action({
  args: {
    code: v.string(),
    sessionToken: v.string(),
    cartSubtotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get user from session token
    const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
      sessionToken: args.sessionToken,
    });

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate coupon
    const validation = await ctx.runMutation(api.mutations.coupons.validateCoupon, {
      code: args.code,
      userId: user._id,
      cartSubtotal: args.cartSubtotal,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid code',
      };
    }

    return {
      success: true,
      coupon: validation.coupon,
    };
  },
});

/**
 * Calculate discount for cart (for mobile app)
 */
export const calculateCartDiscount = action({
  args: {
    couponId: v.id('coupons'),
    cartSubtotal: v.number(),
    deliveryFee: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(api.mutations.coupons.calculateDiscount, {
      couponId: args.couponId,
      cartSubtotal: args.cartSubtotal,
      deliveryFee: args.deliveryFee,
    });

    return {
      success: true,
      ...result,
    };
  },
});

