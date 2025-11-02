import { v } from 'convex/values';
import { mutation } from "../_generated/server";

export const createMeal = mutation(
  async (
    { db },
    args: {
      chefId: string;
      name: string;
      description: string;
      price: number;
      cuisine: string[];
      dietary: string[];
      status: 'available' | 'unavailable';
      images?: string[];
      rating?: number;
    }
  ) => {
    const id = await db.insert("meals", {
      chefId: args.chefId as any, // Should be Id<'chefs'>
      name: args.name,
      description: args.description,
      price: args.price,
      cuisine: args.cuisine,
      dietary: args.dietary,
      status: args.status,
      images: args.images || [],
      rating: args.rating,
    });
    return id;
  }
);

export const updateMealImages = mutation({
  args: {
    mealId: v.id('meals'),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error('Meal not found');
    const images = Array.isArray(meal.images) ? meal.images : [];
    images.push(args.imageUrl);
    await ctx.db.patch(args.mealId, { images });
    return { status: 'ok' };
  }
});

export const setPrimaryMealImage = mutation({
  args: {
    mealId: v.id('meals'),
    imageId: v.string(),
  },
  handler: async (ctx, args) => {
    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error('Meal not found');
    let images = Array.isArray(meal.images) ? meal.images : [];
    // Move imageId to the front if it exists
    images = images.filter((img) => img !== args.imageId);
    images.unshift(args.imageId);
    await ctx.db.patch(args.mealId, { images });
    return { status: 'ok' };
  }
});

export const updateMeal = mutation({
  args: {
    mealId: v.id('meals'),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      cuisine: v.optional(v.array(v.string())),
      dietary: v.optional(v.array(v.string())),
      status: v.optional(v.union(v.literal('available'), v.literal('unavailable'))),
      images: v.optional(v.array(v.string())),
      rating: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mealId, args.updates);
    return true;
  },
});

export const deleteMeal = mutation({
  args: { mealId: v.id('meals') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.mealId);
    return true;
  },
});
