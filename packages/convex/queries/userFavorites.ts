// @ts-nocheck
import { v } from "convex/values";
import { query } from "../_generated/server";

// Check if a food creator/kitchen is favorited by user
export const isFoodCreatorFavorited = query({
  args: {
    userId: v.id("users"),
    foodCreatorId: v.id("chefs"),
  },
  returns: v.object({
    isFavorited: v.boolean(),
    favoriteId: v.optional(v.id("userFavorites")),
  }),
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("favoriteType", "foodCreator")
      )
      .filter((q) => q.eq(q.field("favoriteId"), args.foodCreatorId))
      .first();

    return {
      isFavorited: !!favorite,
      favoriteId: favorite?._id,
    };
  },
});

// Get favorite status by kitchen ID (requires resolving chef from kitchen)
export const isKitchenFavorited = query({
  args: {
    userId: v.id("users"),
    kitchenId: v.id("kitchens"),
  },
  returns: v.object({
    isFavorited: v.boolean(),
    favoriteId: v.optional(v.id("userFavorites")),
    foodCreatorId: v.optional(v.id("chefs")),
  }),
  handler: async (ctx, args) => {
    // Get kitchen to find owner
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen) {
      return { isFavorited: false };
    }

    // Find food creator by userId (kitchen owner_id)
    const foodCreator = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    if (!foodCreator) {
      return { isFavorited: false, foodCreatorId: undefined };
    }

    // Check if food creator is favorited
    const favorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("favoriteType", "foodCreator")
      )
      .filter((q) => q.eq(q.field("favoriteId"), foodCreator._id))
      .first();

    return {
      isFavorited: !!favorite,
      favoriteId: favorite?._id,
      foodCreatorId: foodCreator._id,
    };
  },
});

// Check if a meal/dish is favorited by user
export const isMealFavorited = query({
  args: {
    userId: v.id("users"),
    mealId: v.id("meals"),
  },
  returns: v.object({
    isFavorited: v.boolean(),
    favoriteId: v.optional(v.id("userFavorites")),
  }),
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("favoriteType", "meal")
      )
      .filter((q) => q.eq(q.field("favoriteId"), args.mealId))
      .first();

    return {
      isFavorited: !!favorite,
      favoriteId: favorite?._id,
    };
  },
});

// Get count of likes (favorites) for a food creator
export const getFoodCreatorLikesCount = query({
  args: {
    foodCreatorId: v.id("chefs"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("userFavorites")
      .filter((q) =>
        q.and(
          q.eq(q.field("favoriteType"), "foodCreator"),
          q.eq(q.field("favoriteId"), args.foodCreatorId)
        )
      )
      .collect();

    return favorites.length;
  },
});

