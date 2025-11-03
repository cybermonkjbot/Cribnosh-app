import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Define the expected shape of the details object
const orderDetailsSchema = v.object({
  requirements: v.string(),
  servingSize: v.number(),
  desiredDeliveryTime: v.string(),
  dietaryRestrictions: v.optional(v.union(v.string(), v.null())),
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    requirements: v.string(),
    servingSize: v.number(),
    desiredDeliveryTime: v.string(),
    dietaryRestrictions: v.optional(v.union(v.string(), v.null())),
    customOrderId: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orderId = await ctx.db.insert('custom_orders', {
      userId: args.userId,
      requirements: args.requirements,
      serving_size: args.servingSize,
      desired_delivery_time: args.desiredDeliveryTime,
      dietary_restrictions: args.dietaryRestrictions || null,
      custom_order_id: args.customOrderId,
      order_id: args.orderId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return orderId;
  },
});

export const update = mutation({
  args: {
    orderId: v.id('custom_orders'),
    updates: v.object({
      requirements: v.optional(v.string()),
      servingSize: v.optional(v.number()),
      desiredDeliveryTime: v.optional(v.string()),
      dietaryRestrictions: v.optional(v.union(v.string(), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    const { orderId, updates } = args;
    
    // Transform camelCase to snake_case for database fields
    const dbUpdates: Record<string, any> = {
      updatedAt: Date.now(), // Always update the timestamp
    };
    
    if ('servingSize' in updates && updates.servingSize !== undefined) {
      dbUpdates.serving_size = updates.servingSize;
    }
    if ('desiredDeliveryTime' in updates && updates.desiredDeliveryTime !== undefined) {
      dbUpdates.desired_delivery_time = updates.desiredDeliveryTime;
    }
    if ('dietaryRestrictions' in updates) {
      dbUpdates.dietary_restrictions = updates.dietaryRestrictions;
    }
    if ('requirements' in updates && updates.requirements !== undefined) {
      dbUpdates.requirements = updates.requirements;
    }
    
    await ctx.db.patch(orderId, dbUpdates);
    
    return await ctx.db.get(orderId);
  },
});

export const deleteOrder = mutation({
  args: {
    orderId: v.id('custom_orders'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orderId);
    return { success: true };
  },
});
