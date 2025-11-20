import { query } from "../_generated/server";
import { v } from "convex/values";

// Get recipes feed with pagination
export const getRecipes = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    cuisine: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    )),
    search: v.optional(v.string()),
  },
  returns: v.object({
    recipes: v.array(v.object({
      _id: v.id("recipes"),
      _creationTime: v.number(),
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
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      ),
      featuredImage: v.optional(v.string()),
      videoId: v.optional(v.id("videoPosts")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get recipes with filters
    let recipesQuery = ctx.db
      .query('recipes')
      .withIndex('by_status', q => q.eq('status', 'published'))
      .order('desc');

    if (cursor) {
      recipesQuery = recipesQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const recipes = await recipesQuery.take(limit + 1);
    const hasMore = recipes.length > limit;
    const recipesToReturn = hasMore ? recipes.slice(0, limit) : recipes;

    // Apply additional filters
    let filteredRecipes = recipesToReturn;
    
    if (args.cuisine) {
      filteredRecipes = filteredRecipes.filter(r => r.cuisine === args.cuisine);
    }
    
    if (args.difficulty) {
      filteredRecipes = filteredRecipes.filter(r => r.difficulty === args.difficulty);
    }
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filteredRecipes = filteredRecipes.filter(r =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.ingredients.some(ing => ing.name.toLowerCase().includes(searchLower))
      );
    }

    const nextCursor = hasMore && filteredRecipes.length > 0
      ? filteredRecipes[filteredRecipes.length - 1]._creationTime.toString()
      : undefined;

    return {
      recipes: filteredRecipes,
      nextCursor,
    };
  },
});

// Get recipe by ID
export const getRecipeById = query({
  args: {
    recipeId: v.id("recipes"),
  },
  returns: v.union(v.object({
    _id: v.id("recipes"),
    _creationTime: v.number(),
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
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    featuredImage: v.optional(v.string()),
    videoId: v.optional(v.id("videoPosts")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }), v.null()),
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    return recipe;
  },
});

// Get recipes by author (returns all statuses for chef's own content)
export const getByAuthor = query({
  args: {
    author: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all recipes by author (including drafts and archived)
    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_author', q => q.eq('author', args.author))
      .collect();
    
    // Sort by creation time (newest first)
    recipes.sort((a, b) => (b.createdAt || b._creationTime || 0) - (a.createdAt || a._creationTime || 0));
    
    return recipes;
  },
});

// Get recipes by author
export const getRecipesByAuthor = query({
  args: {
    author: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    recipes: v.array(v.object({
      _id: v.id("recipes"),
      _creationTime: v.number(),
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
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      ),
      featuredImage: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    let recipesQuery = ctx.db
      .query('recipes')
      .withIndex('by_author', q => q.eq('author', args.author))
      .filter(q => q.eq(q.field('status'), 'published'))
      .order('desc');

    if (cursor) {
      recipesQuery = recipesQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const recipes = await recipesQuery.take(limit + 1);
    const hasMore = recipes.length > limit;
    const recipesToReturn = hasMore ? recipes.slice(0, limit) : recipes;

    const nextCursor = hasMore && recipesToReturn.length > 0
      ? recipesToReturn[recipesToReturn.length - 1]._creationTime.toString()
      : undefined;

    return {
      recipes: recipesToReturn,
      nextCursor,
    };
  },
});

