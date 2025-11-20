import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { isAdmin, isStaff, requireAuth } from '../utils/auth';

// Create a new recipe
export const createRecipe = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.string(),
    })),
    instructions: v.array(v.string()),
    prepTime: v.number(),
    cookTime: v.number(),
    servings: v.number(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    cuisine: v.string(),
    dietary: v.array(v.string()),
    author: v.string(),
    featuredImage: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
    sessionToken: v.optional(v.string()),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Verify author matches user (chefs can only create recipes for themselves)
    // Get chef profile to verify name matches
    const chefs = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), user._id))
      .collect();
    
    const chef = chefs[0];
    
    // Allow if user is admin/staff, or if author matches chef name
    if (!isAdmin(user) && !isStaff(user)) {
      if (!chef || chef.name !== args.author) {
        throw new Error('Access denied: You can only create recipes for yourself');
      }
    }
    
    const now = Date.now();
    
    const recipeId = await ctx.db.insert("recipes", {
      title: args.title,
      description: args.description,
      ingredients: args.ingredients,
      instructions: args.instructions,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      difficulty: args.difficulty,
      cuisine: args.cuisine,
      dietary: args.dietary,
      author: args.author,
      featuredImage: args.featuredImage,
      status: args.status || "published",
      createdAt: now,
      updatedAt: now,
    });

    return recipeId;
  },
});

// Update a recipe
export const updateRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ingredients: v.optional(v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.string(),
    }))),
    instructions: v.optional(v.array(v.string())),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    servings: v.optional(v.number()),
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    )),
    cuisine: v.optional(v.string()),
    dietary: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
    sessionToken: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get recipe to verify ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    // Get chef profile to verify ownership
    const chefs = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), user._id))
      .collect();
    
    const chef = chefs[0];
    
    // Allow if user is admin/staff, or if recipe author matches chef name
    if (!isAdmin(user) && !isStaff(user)) {
      if (!chef || chef.name !== recipe.author) {
        throw new Error('Access denied: You can only edit your own recipes');
      }
    }
    
    const { recipeId, sessionToken, ...updates } = args;
    
    await ctx.db.patch(recipeId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Delete a recipe (soft delete by archiving)
export const deleteRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    sessionToken: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get recipe to verify ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    // Get chef profile to verify ownership
    const chefs = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), user._id))
      .collect();
    
    const chef = chefs[0];
    
    // Allow if user is admin/staff, or if recipe author matches chef name
    if (!isAdmin(user) && !isStaff(user)) {
      if (!chef || chef.name !== recipe.author) {
        throw new Error('Access denied: You can only delete your own recipes');
      }
    }
    
    await ctx.db.patch(args.recipeId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal mutation for seeding - bypasses auth
export const createRecipeForSeed = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.string(),
    })),
    instructions: v.array(v.string()),
    prepTime: v.number(),
    cookTime: v.number(),
    servings: v.number(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    cuisine: v.string(),
    dietary: v.array(v.string()),
    author: v.string(),
    featuredImage: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const recipeId = await ctx.db.insert("recipes", {
      title: args.title,
      description: args.description,
      ingredients: args.ingredients,
      instructions: args.instructions,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      difficulty: args.difficulty,
      cuisine: args.cuisine,
      dietary: args.dietary,
      author: args.author,
      featuredImage: args.featuredImage,
      status: args.status || "published",
      createdAt: now,
      updatedAt: now,
    });

    return recipeId;
  },
});

