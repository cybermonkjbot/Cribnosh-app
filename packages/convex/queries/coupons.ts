// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';

/**
 * Get coupon by code
 */
export const getCouponByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const codeUpper = args.code.trim().toUpperCase();
    const coupon = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', codeUpper))
      .first();

    if (!coupon) {
      return null;
    }

    return {
      _id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount: coupon.max_discount,
      min_order_amount: coupon.min_order_amount,
      description: coupon.description,
      status: coupon.status,
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
    };
  },
});

/**
 * Get user's coupon usage count for a specific coupon
 */
export const getUserCouponUsageCount = query({
  args: {
    couponId: v.id('coupons'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query('coupon_usage')
      .withIndex('by_user_coupon', (q) =>
        q.eq('user_id', args.userId).eq('coupon_id', args.couponId)
      )
      .collect();

    return usage.length;
  },
});

