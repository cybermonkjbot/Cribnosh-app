import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { requireAuth } from '../utils/auth';

/**
 * Add side to cart item
 */
export const addSideToCartItem = mutation({
  args: {
    userId: v.id('users'),
    cartItemId: v.string(), // The meal ID in the cart
    sideId: v.id('sides'),
    quantity: v.number(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { 
    userId: Id<'users'>; 
    cartItemId: string; 
    sideId: Id<'sides'>; 
    quantity: number;
    sessionToken?: string;
  }) => {
    await requireAuth(ctx, args.sessionToken);

    // Get side details
    const side = await ctx.db.get(args.sideId);
    if (!side || !side.available) {
      throw new Error('Side not available');
    }

    // Get user's cart
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Find the cart item
    const itemIndex = cart.items.findIndex((item) => item.id === args.cartItemId);
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    const item = cart.items[itemIndex];
    const existingSides = item.sides || [];

    // Check if side already exists in this item
    const sideIndex = existingSides.findIndex((s) => s.id === args.sideId);
    
    const updatedSides = [...existingSides];
    if (sideIndex >= 0) {
      // Update existing side quantity
      updatedSides[sideIndex] = {
        ...updatedSides[sideIndex],
        quantity: updatedSides[sideIndex].quantity + args.quantity,
      };
    } else {
      // Add new side
      updatedSides.push({
        id: args.sideId,
        name: side.name,
        price: side.price,
        quantity: args.quantity,
      });
    }

    // Update cart item with new sides
    const updatedItems = [...cart.items];
    updatedItems[itemIndex] = {
      ...item,
      sides: updatedSides,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(cart._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update side quantity in cart item
 */
export const updateSideQuantity = mutation({
  args: {
    userId: v.id('users'),
    cartItemId: v.string(),
    sideId: v.string(),
    quantity: v.number(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { 
    userId: Id<'users'>; 
    cartItemId: string; 
    sideId: string; 
    quantity: number;
    sessionToken?: string;
  }) => {
    await requireAuth(ctx, args.sessionToken);

    if (args.quantity <= 0) {
      // Remove side if quantity is 0 - call the mutation directly
      const cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .first();

      if (!cart) {
        throw new Error('Cart not found');
      }

      const itemIndex = cart.items.findIndex((item) => item.id === args.cartItemId);
      if (itemIndex === -1) {
        throw new Error('Cart item not found');
      }

      const item = cart.items[itemIndex];
      const existingSides = item.sides || [];
      const updatedSides = existingSides.filter((s) => s.id !== args.sideId);

      const updatedItems = [...cart.items];
      updatedItems[itemIndex] = {
        ...item,
        sides: updatedSides.length > 0 ? updatedSides : undefined,
        updatedAt: Date.now(),
      };

      await ctx.db.patch(cart._id, {
        items: updatedItems,
        updatedAt: Date.now(),
      });

      return { success: true };
    }

    // Get user's cart
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Find the cart item
    const itemIndex = cart.items.findIndex((item) => item.id === args.cartItemId);
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    const item = cart.items[itemIndex];
    const existingSides = item.sides || [];
    const sideIndex = existingSides.findIndex((s) => s.id === args.sideId);

    if (sideIndex === -1) {
      throw new Error('Side not found in cart item');
    }

    // Update side quantity
    const updatedSides = [...existingSides];
    updatedSides[sideIndex] = {
      ...updatedSides[sideIndex],
      quantity: args.quantity,
    };

    // Update cart item
    const updatedItems = [...cart.items];
    updatedItems[itemIndex] = {
      ...item,
      sides: updatedSides,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(cart._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove side from cart item
 */
export const removeSideFromCartItem = mutation({
  args: {
    userId: v.id('users'),
    cartItemId: v.string(),
    sideId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { 
    userId: Id<'users'>; 
    cartItemId: string; 
    sideId: string; 
    sessionToken?: string;
  }) => {
    await requireAuth(ctx, args.sessionToken);

    // Get user's cart
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Find the cart item
    const itemIndex = cart.items.findIndex((item) => item.id === args.cartItemId);
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    const item = cart.items[itemIndex];
    const existingSides = item.sides || [];
    const updatedSides = existingSides.filter((s) => s.id !== args.sideId);

    // Update cart item
    const updatedItems = [...cart.items];
    updatedItems[itemIndex] = {
      ...item,
      sides: updatedSides.length > 0 ? updatedSides : undefined,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(cart._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

