import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Get cart by user ID
export const getByUser = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.user_id))
      .first();
    
    return cart || {
      userId: args.user_id,
      items: [],
      updatedAt: Date.now()
    };
  },
});

// Get cart items count
export const getCartItemCount = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.user_id))
      .first();
    
    if (!cart || !cart.items) {
      return 0;
    }
    
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  },
});

// Get cart total price
export const getCartTotal = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.user_id))
      .first();
    
    if (!cart || !cart.items) {
      return 0;
    }
    
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
}); 