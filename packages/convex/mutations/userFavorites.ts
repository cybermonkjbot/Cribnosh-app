import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Add chef/kitchen to favorites
export const addFavorite = mutation({
  args: {
    userId: v.id("users"),
    chefId: v.id("chefs"),
  },
  returns: v.id("userFavorites"),
  handler: async (ctx, args) => {
    // Check if already favorited
    const existing = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("favoriteType", "chef")
      )
      .filter((q) => q.eq(q.field("favoriteId"), args.chefId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Add to favorites
    const favoriteId = await ctx.db.insert("userFavorites", {
      userId: args.userId,
      favoriteType: "chef",
      favoriteId: args.chefId,
      createdAt: Date.now(),
    });

    return favoriteId;
  },
});

// Remove chef/kitchen from favorites
export const removeFavorite = mutation({
  args: {
    userId: v.id("users"),
    chefId: v.id("chefs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find favorite
    const favorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("favoriteType", "chef")
      )
      .filter((q) => q.eq(q.field("favoriteId"), args.chefId))
      .first();

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }

    return null;
  },
});

// Toggle favorite (add if not exists, remove if exists)
export const toggleFavorite = mutation({
  args: {
    userId: v.id("users"),
    chefId: v.id("chefs"),
  },
  returns: v.object({
    isFavorited: v.boolean(),
    favoriteId: v.optional(v.id("userFavorites")),
  }),
  handler: async (ctx, args) => {
    // Check if already favorited
    const existing = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("favoriteType", "chef")
      )
      .filter((q) => q.eq(q.field("favoriteId"), args.chefId))
      .first();

    if (existing) {
      // Remove from favorites
      await ctx.db.delete(existing._id);
      return { isFavorited: false };
    } else {
      // Add to favorites
      const favoriteId = await ctx.db.insert("userFavorites", {
        userId: args.userId,
        favoriteType: "chef",
        favoriteId: args.chefId,
        createdAt: Date.now(),
      });
      return { isFavorited: true, favoriteId };
    }
  },
});

