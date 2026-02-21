// @ts-nocheck
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

/**
 * Helper function to check if a food creator has any meals
 * Returns true if food creator has at least one meal (regardless of status)
 */
async function foodCreatorHasMeals(ctx: any, foodCreatorId: Id<"chefs">): Promise<boolean> {
  const meals = await ctx.db
    .query('meals')
    .filter(q => q.eq(q.field('chefId'), foodCreatorId))
    .first();
  return meals !== null;
}

// Get featured video for a kitchen
export const getFeaturedVideo = query({
  args: {
    kitchenId: v.id("kitchens"),
  },
  returns: v.union(
    v.object({
      _id: v.id("videoPosts"),
      _creationTime: v.number(),
      creatorId: v.id("users"),
      kitchenId: v.optional(v.id("kitchens")),
      title: v.string(),
      description: v.optional(v.string()),
      videoUrl: v.string(),
      thumbnailUrl: v.optional(v.string()),
      duration: v.number(),
      fileSize: v.number(),
      resolution: v.object({
        width: v.number(),
        height: v.number(),
      }),
      tags: v.array(v.string()),
      cuisine: v.optional(v.string()),
      difficulty: v.optional(v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )),
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived"),
        v.literal("flagged"),
        v.literal("removed")
      ),
      visibility: v.union(
        v.literal("public"),
        v.literal("followers"),
        v.literal("private")
      ),
      isLive: v.optional(v.boolean()),
      liveSessionId: v.optional(v.id("liveSessions")),
      likesCount: v.number(),
      commentsCount: v.number(),
      sharesCount: v.number(),
      viewsCount: v.number(),
      publishedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      creator: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatar: v.optional(v.string()),
        roles: v.optional(v.array(v.string())),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get kitchen
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen || !kitchen.featuredVideoId) {
      return null;
    }

    // Get featured video
    const video = await ctx.db.get(kitchen.featuredVideoId);
    if (!video || video.status !== "published") {
      return null;
    }

    // Get creator info
    const creator = await ctx.db.get(video.creatorId);
    if (!creator) {
      throw new Error("Creator not found");
    }

    // Generate URLs from Convex storage IDs
    const videoUrl = await ctx.storage.getUrl(video.videoStorageId) || '';
    const thumbnailUrl = video.thumbnailStorageId
      ? await ctx.storage.getUrl(video.thumbnailStorageId) || undefined
      : undefined;

    return {
      ...video,
      videoUrl,
      thumbnailUrl,
      creator: {
        _id: creator._id,
        name: creator.name,
        avatar: creator.avatar,
        roles: creator.roles,
      },
    };
  },
});

// Get food creator ID from kitchen ID (helper query)
export const getFoodCreatorByKitchenId = query({
  args: {
    kitchenId: v.id("kitchens"),
  },
  returns: v.union(v.id("chefs"), v.null()),
  handler: async (ctx, args) => {
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen) {
      return null;
    }

    // Find food creator by userId (kitchen owner_id)
    const foodCreator = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    return foodCreator?._id || null;
  },
});

// Get kitchen ID from food creator ID (helper query)
export const getKitchenByFoodCreatorId = query({
  args: {
    foodCreatorId: v.id("chefs"),
  },
  returns: v.union(v.id("kitchens"), v.null()),
  handler: async (ctx, args) => {
    const foodCreator = await ctx.db.get(args.foodCreatorId);
    if (!foodCreator) {
      return null;
    }

    // Find kitchen by owner_id (food creator userId)
    const kitchen = await ctx.db
      .query("kitchens")
      .filter((q) => q.eq(q.field("owner_id"), foodCreator.userId))
      .first();

    return kitchen?._id || null;
  },
});

// Get kitchen details by kitchen ID or food creator ID (including food creator name)
// This flexible version accepts either ID type and normalizes it
export const getKitchenDetails = query({
  args: {
    kitchenId: v.union(v.id("kitchens"), v.id("chefs")),
  },
  returns: v.union(
    v.object({
      kitchenId: v.id("kitchens"),
      foodCreatorId: v.id("chefs"),
      foodCreatorName: v.string(),
      kitchenName: v.string(),
      address: v.string(),
      certified: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let kitchen: any = null;
    const id = args.kitchenId as any;

    // Try as kitchen ID first
    kitchen = await ctx.db.get(id);

    // If not found as kitchen, try as food creator ID
    if (!kitchen) {
      const foodCreator = await ctx.db.get(id);
      if (foodCreator) {
        // Find kitchen by owner_id (food creator userId)
        kitchen = await ctx.db
          .query("kitchens")
          .filter((q) => q.eq(q.field("owner_id"), foodCreator.userId))
          .first();
      }
    }

    if (!kitchen) {
      return null;
    }

    // Find food creator by userId (kitchen owner_id)
    const foodCreator = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    if (!foodCreator) {
      return null;
    }

    // Filter out kitchens where the food creator has no meals
    const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
    if (!hasMeals) {
      return null;
    }

    const foodCreatorName = foodCreator.name || `Food Creator ${foodCreator._id.slice(-4)}`;
    const kitchenName = `${foodCreatorName}'s Kitchen`;

    return {
      kitchenId: kitchen._id,
      foodCreatorId: foodCreator._id,
      foodCreatorName,
      kitchenName,
      address: kitchen.address,
      certified: kitchen.certified,
    };
  },
});

// Get full kitchen document by kitchen ID (for chef settings)
export const getKitchenById = query({
  args: {
    kitchenId: v.id("kitchens"),
  },
  returns: v.union(
    v.object({
      _id: v.id("kitchens"),
      owner_id: v.id("users"),
      address: v.string(),
      certified: v.boolean(),
      inspectionDates: v.optional(v.array(v.string())),
      images: v.optional(v.array(v.string())),
      featuredVideoId: v.optional(v.id("videoPosts")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen) {
      return null;
    }
    // Return only the fields defined in the validator
    return {
      _id: kitchen._id,
      owner_id: kitchen.owner_id,
      address: kitchen.address,
      certified: kitchen.certified,
      ...(kitchen.inspectionDates !== undefined && { inspectionDates: kitchen.inspectionDates }),
      ...(kitchen.images !== undefined && { images: kitchen.images }),
      ...(kitchen.featuredVideoId !== undefined && { featuredVideoId: kitchen.featuredVideoId }),
    };
  },
});

// Get unique tags from kitchen meals (dietary tags that kitchen has used)
export const getKitchenTags = query({
  args: {
    kitchenId: v.id("kitchens"),
  },
  returns: v.array(
    v.object({
      tag: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen) {
      return [];
    }

    // Find food creator by userId (kitchen owner_id)
    const foodCreator = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    if (!foodCreator) {
      return [];
    }

    // Get all meals for this food creator
    const meals = await ctx.db
      .query("meals")
      .filter((q) => q.eq(q.field("chefId"), foodCreator._id))
      .filter((q) => q.eq(q.field("status"), "available"))
      .collect();

    // Extract all dietary tags and count occurrences
    const tagCounts: Record<string, number> = {};
    meals.forEach((meal) => {
      if (meal.dietary && Array.isArray(meal.dietary)) {
        meal.dietary.forEach((tag: string) => {
          if (tag && tag.trim()) {
            const normalizedTag = tag.trim().toLowerCase();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by count (most common first)
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return tags;
  },
});

/**
 * Get all kitchens (for admin)
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('kitchens').collect();
  },
});
