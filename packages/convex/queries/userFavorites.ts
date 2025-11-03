import { query } from "../_generated/server";
import { v } from "convex/values";

// Check if a chef/kitchen is favorited by user
export const isChefFavorited = query({
  args: {
    userId: v.id("users"),
    chefId: v.id("chefs"),
  },
  returns: v.object({
    isFavorited: v.boolean(),
    favoriteId: v.optional(v.id("userFavorites")),
  }),
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("favoriteType", "chef")
      )
      .filter((q) => q.eq(q.field("favoriteId"), args.chefId))
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
    chefId: v.optional(v.id("chefs")),
  }),
  handler: async (ctx, args) => {
    // Get kitchen to find owner
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen) {
      return { isFavorited: false };
    }

    // Find chef by userId (kitchen owner_id)
    const chef = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    if (!chef) {
      return { isFavorited: false, chefId: undefined };
    }

    // Check if chef is favorited
    const favorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("favoriteType", "chef")
      )
      .filter((q) => q.eq(q.field("favoriteId"), chef._id))
      .first();

    return {
      isFavorited: !!favorite,
      favoriteId: favorite?._id,
      chefId: chef._id,
    };
  },
});

