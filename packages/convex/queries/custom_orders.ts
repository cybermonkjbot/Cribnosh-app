import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { estimateCustomOrderPrice } from '../utils/priceEstimation';

/**
 * Get a custom order by its ID
 */
export const getCustomOrderById = query({
  args: { 
    customOrderId: v.union(v.string(), v.id('custom_orders')) 
  },
  handler: async (ctx, args) => {
    if (args.customOrderId.startsWith('custom_')) {
      return await ctx.db
        .query('custom_orders')
        .filter(q => q.eq(q.field('custom_order_id'), args.customOrderId))
        .first();
    } else {
      // If it's a document ID
      return await ctx.db.get(args.customOrderId as Id<'custom_orders'>);
    }
  }
});

/**
 * Alias for getCustomOrderById that matches the API usage in the frontend
 */
export const getById = getCustomOrderById;

/**
 * Get all custom orders
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('custom_orders').collect();
  }
});

/**
 * Alias for getAll for backward compatibility
 */
export const getAllOrders = getAll;

/**
 * Get custom orders by user ID
 */
export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('custom_orders')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .collect();
  }
});

/**
 * Estimate price for a custom order without creating it
 */
export const estimatePrice = query({
  args: {
    requirements: v.string(),
    servingSize: v.number(),
    dietaryRestrictions: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const estimatedPrice = await estimateCustomOrderPrice(
      ctx,
      args.requirements,
      args.servingSize,
      args.dietaryRestrictions
    );
    return {
      estimatedPrice,
    };
  },
});