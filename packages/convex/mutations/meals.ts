import { v } from 'convex/values';
import { mutation, internalMutation } from "../_generated/server";
import { requireAuth, requireStaff, requireAdmin, isAdmin, isStaff } from '../utils/auth';

export const createMeal = mutation(
  async (
    ctx,
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
      sessionToken?: string;
    }
  ) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId as any);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only create meals for their own chef profile, staff/admin can create for any chef
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    const id = await ctx.db.insert("meals", {
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
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error('Meal not found');
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(meal.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only update meals for their own chef profile, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
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
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error('Meal not found');
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(meal.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only update meals for their own chef profile, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
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
      linkedRecipeId: v.optional(v.id('recipes')),
      linkedVideoIds: v.optional(v.array(v.id('videoPosts'))),
    }),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const meal = await ctx.db.get(args.mealId);
    if (!meal) {
      throw new Error('Meal not found');
    }
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(meal.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only update meals for their own chef profile, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    await ctx.db.patch(args.mealId, args.updates);
    return true;
  },
});

export const deleteMeal = mutation({
  args: { 
    mealId: v.id('meals'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const meal = await ctx.db.get(args.mealId);
    if (!meal) {
      throw new Error('Meal not found');
    }
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(meal.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only delete meals for their own chef profile, staff/admin can delete any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    await ctx.db.delete(args.mealId);
    return true;
  },
});

// Internal mutation to update meal embedding
export const updateMealEmbedding = internalMutation({
  args: {
    mealId: v.id('meals'),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mealId, {
      embedding: args.embedding,
    });
    return { success: true };
  },
});

// Internal mutation for seeding - bypasses auth
export const createMealForSeed = internalMutation({
  args: {
    chefId: v.id('chefs'),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    cuisine: v.array(v.string()),
    dietary: v.array(v.string()),
    status: v.union(v.literal('available'), v.literal('unavailable')),
    images: v.optional(v.array(v.string())),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("meals", {
      chefId: args.chefId,
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
  },
});
