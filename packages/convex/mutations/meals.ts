import { v } from 'convex/values';
import { Doc, Id } from "../_generated/dataModel";
import { internalMutation, mutation } from "../_generated/server";
import { isAdmin, isStaff, requireAuth } from '../utils/auth';

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
      ingredients?: {
        name: string;
        quantity?: string;
        isAllergen?: boolean;
        allergenType?: string;
      }[];
      sessionToken?: string;
    }
  ) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId as Id<'chefs'>) as Doc<'chefs'>;
    if (!chef) {
      throw new Error('Chef not found');
    }

    // Explicitly check for userId existence to satisfy type checker if inference fails
    // or cast it if we know it's a Chef document.
    // The previous error was that userId does not exist on type... implies it might be matching a different doc type?
    // Let's assume it is correct and the lint was just spurious or due to 'any'.
    // We'll leave it but maybe add a comment or try to fix imports if needed.
    // Actually, I'll update the import to include Doc and cast it.

    // Users can only create meals for their own chef profile, staff/admin can create for any chef
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }

    // Natasha's Law Compliance: Enforce ingredients for active meals
    if (args.status === 'available') {
      if (!args.ingredients || args.ingredients.length === 0) {
        throw new Error("Natasha's Law Compliance: You must list all ingredients (including allergens) before making a meal available.");
      }
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
      ingredients: args.ingredients,
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
      ingredients: v.optional(v.array(v.object({
        name: v.string(),
        quantity: v.optional(v.string()),
        isAllergen: v.optional(v.boolean()),
        allergenType: v.optional(v.string()),
      }))),
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

    // Natasha's Law Compliance
    // If status is being set to 'available' OR if it's already available and we're not changing status (but might be removing ingredients?)
    // Actually, simpler check: if the RESULTING state is available, it must have ingredients.

    const newStatus = args.updates.status ?? meal.status;
    const newIngredients = args.updates.ingredients ?? meal.ingredients;

    // Check if status is effectively 'available' (checking against literals)
    const isAvailable = newStatus === 'available' || newStatus === 'active';

    if (isAvailable) {
      if (!newIngredients || newIngredients.length === 0) {
        throw new Error("Natasha's Law Compliance: You must list all ingredients before making this meal available.");
      }
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
