// @ts-nocheck
import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { api } from '../_generated/api';

/**
 * Validate a coupon/discount code
 */
export const validateCoupon = mutation({
  args: {
    code: v.string(),
    userId: v.id('users'),
    cartSubtotal: v.optional(v.number()), // Optional cart subtotal for min_order_amount validation
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const codeUpper = args.code.trim().toUpperCase();

    // Find coupon by code
    const coupon = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', codeUpper))
      .first();

    if (!coupon) {
      return {
        valid: false,
        error: 'Invalid code',
      };
    }

    // Check status
    if (coupon.status !== 'active') {
      return {
        valid: false,
        error: 'This code is no longer active',
      };
    }

    // Check validity dates
    if (coupon.valid_from > now) {
      return {
        valid: false,
        error: 'This code is not yet valid',
      };
    }

    if (coupon.valid_until && coupon.valid_until < now) {
      // Mark as expired
      await ctx.db.patch(coupon._id, {
        status: 'expired',
        updated_at: now,
      });
      return {
        valid: false,
        error: 'This code has expired',
      };
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return {
        valid: false,
        error: 'This code has reached its usage limit',
      };
    }

    // Check minimum order amount
    if (coupon.min_order_amount && args.cartSubtotal) {
      if (args.cartSubtotal < coupon.min_order_amount) {
        return {
          valid: false,
          error: `Minimum order amount of £${coupon.min_order_amount.toFixed(2)} required`,
        };
      }
    }

    // Check user limit
    if (coupon.user_limit) {
      const userUsageCount = await ctx.db
        .query('coupon_usage')
        .withIndex('by_user_coupon', (q) =>
          q.eq('user_id', args.userId).eq('coupon_id', coupon._id)
        )
        .collect();

      if (userUsageCount.length >= coupon.user_limit) {
        return {
          valid: false,
          error: 'You have reached the usage limit for this code',
        };
      }
    }

    return {
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount,
        description: coupon.description,
      },
    };
  },
});

/**
 * Apply a coupon to calculate discount amount
 */
export const calculateDiscount = mutation({
  args: {
    couponId: v.id('coupons'),
    cartSubtotal: v.number(),
    deliveryFee: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);

    if (!coupon || coupon.status !== 'active') {
      throw new Error('Invalid coupon');
    }

    let discountAmount = 0;
    let freeDelivery = false;

    switch (coupon.discount_type) {
      case 'percentage':
        discountAmount = (args.cartSubtotal * coupon.discount_value) / 100;
        if (coupon.max_discount && discountAmount > coupon.max_discount) {
          discountAmount = coupon.max_discount;
        }
        break;

      case 'fixed_amount':
        discountAmount = Math.min(coupon.discount_value, args.cartSubtotal);
        break;

      case 'free_delivery':
        freeDelivery = true;
        discountAmount = args.deliveryFee || 0;
        break;

      default:
        throw new Error('Invalid discount type');
    }

    return {
      discountAmount,
      freeDelivery,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        discount_type: coupon.discount_type,
      },
    };
  },
});

/**
 * Record coupon usage (called when order is placed)
 */
export const recordCouponUsage = mutation({
  args: {
    couponId: v.id('coupons'),
    userId: v.id('users'),
    orderId: v.optional(v.id('orders')),
    discountAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Record usage
    await ctx.db.insert('coupon_usage', {
      coupon_id: args.couponId,
      user_id: args.userId,
      order_id: args.orderId,
      used_at: now,
      discount_amount: args.discountAmount,
    });

    // Increment usage count on coupon
    const coupon = await ctx.db.get(args.couponId);
    if (coupon) {
      await ctx.db.patch(args.couponId, {
        usage_count: coupon.usage_count + 1,
        updated_at: now,
      });
    }
  },
});

