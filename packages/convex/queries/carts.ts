import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { query } from '../_generated/server';
import { requireAuth } from '../utils/auth';

// Get cart by user ID
// @ts-ignore: Type instantiation is excessively deep
export const getByUser = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', args.user_id))
      .first();

    return cart || {
      userId: args.user_id,
      items: [],
      updatedAt: Date.now()
    };
  },
});

// Get cart items count
// @ts-ignore: Type instantiation is excessively deep
export const getCartItemCount = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', args.user_id))
      .first();

    if (!cart || !cart.items) {
      return 0;
    }

    return cart.items.reduce((total: number, item: any) => total + item.quantity, 0);
  },
});

// Get cart total price
// @ts-ignore: Type instantiation is excessively deep
export const getCartTotal = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', args.user_id))
      .first();

    if (!cart || !cart.items) {
      return 0;
    }

    return cart.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
  },
});

// Get enriched cart for mobile app by session token
// @ts-ignore: Type instantiation is excessively deep
export const getEnrichedCartBySessionToken = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    // Authenticate user
    const user = await requireAuth(ctx, args.sessionToken);

    // Get cart
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .first();

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        success: true as const,
        cart: [],
      };
    }

    // Enrich cart items with meal and chef details
    const enrichedItems = await Promise.all(
      cart.items.map(async (item: any) => {
        try {
          // Get meal details
          const mealId = item.id as Id<'meals'>;
          const meal = await ctx.db.get(mealId);

          // Get chef details if available
          let chefName: string | undefined;
          if (meal?.chefId) {
            const chef = await ctx.db.get(meal.chefId);
            chefName = chef?.name;
          }

          // Get first image URL if available
          let imageUrl: string | undefined = undefined;
          if (meal?.images && Array.isArray(meal.images) && meal.images.length > 0) {
            const firstImage = meal.images[0];
            if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
              imageUrl = firstImage;
            } else {
              // Assume it's a Convex storage ID
              try {
                const url = await ctx.storage.getUrl(firstImage);
                if (url) imageUrl = url;
              } catch (e) {
                // Ignore storage errors
              }
            }
          }

          return {
            _id: item.id, // Keep original ID string
            dish_id: item.id,
            quantity: item.quantity,
            price: item.price,
            total_price: item.price * item.quantity,
            name: meal?.name || 'Unknown Item',
            image_url: imageUrl,
            chef_id: meal?.chefId,
            chef_name: chefName,
            added_at: item.added_at,
          };
        } catch (error) {
          // Fallback for failed enrichment
          return {
            _id: item.id,
            dish_id: item.id,
            quantity: item.quantity,
            price: item.price,
            total_price: item.price * item.quantity,
            name: 'Item Unavailable',
            added_at: item.added_at,
          };
        }
      })
    );

    return {
      success: true as const,
      cart: enrichedItems,
    };
  },
});