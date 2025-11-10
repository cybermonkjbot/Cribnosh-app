"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

/**
 * Complete order from cart flow that handles:
 * - Creating order with payment
 * - Recording family spending (if applicable)
 * - Clearing cart
 * - Returning full order details
 * 
 * This consolidates multiple roundtrips into a single action call
 */
export const createOrderFromCartComplete = action({
  args: {
    customer_id: v.string(),
    chef_id: v.string(),
    order_items: v.array(v.object({
      dish_id: v.string(),
      quantity: v.number(),
      price: v.number(),
      name: v.string(),
    })),
    total_amount: v.number(),
    payment_id: v.string(),
    payment_method: v.optional(v.string()),
    special_instructions: v.optional(v.string()),
    delivery_time: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
    // Family order metadata (optional)
    family_profile_id: v.optional(v.string()),
    member_user_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Step 1: Create order with payment
    const order = await ctx.runMutation(api.mutations.orders.createOrderWithPayment, {
      customer_id: args.customer_id,
      chef_id: args.chef_id,
      order_items: args.order_items,
      total_amount: args.total_amount,
      payment_id: args.payment_id,
      payment_method: args.payment_method,
      special_instructions: args.special_instructions,
      delivery_time: args.delivery_time,
      delivery_address: args.delivery_address,
    });

    // Step 2: Record family spending if this is a family order
    if (args.family_profile_id && args.member_user_id) {
      try {
        await ctx.runMutation(api.mutations.familyProfiles.recordOrderSpending, {
          family_profile_id: args.family_profile_id as Id<'familyProfiles'>,
          member_user_id: args.member_user_id as Id<'users'>,
          order_amount: args.total_amount,
          currency: 'gbp',
        });
      } catch (error) {
        console.warn('Could not record family member spending:', error);
        // Continue - order is created, budget tracking can be retried
      }
    }

    // Step 3: Clear cart after order creation
    try {
      await ctx.runMutation(api.mutations.orders.clearCart, {
        userId: args.customer_id as Id<'users'>,
      });
    } catch (error) {
      console.warn('Could not clear cart after order creation:', error);
      // Continue - order is created, cart clearing can be retried
    }

    // Step 4: Return full order (already returned from createOrderWithPayment)
    return order;
  },
});

