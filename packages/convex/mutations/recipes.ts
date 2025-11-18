import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { recipeId, ...updates } = args;
    
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

