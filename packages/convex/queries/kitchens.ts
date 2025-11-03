import { v } from "convex/values";
import { query } from "../_generated/server";

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

// Get chef ID from kitchen ID (helper query)
export const getChefByKitchenId = query({
  args: {
    kitchenId: v.id("kitchens"),
  },
  returns: v.union(v.id("chefs"), v.null()),
  handler: async (ctx, args) => {
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen) {
      return null;
    }

    // Find chef by userId (kitchen owner_id)
    const chef = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    return chef?._id || null;
  },
});

// Get kitchen details by kitchen ID (including chef name)
export const getKitchenDetails = query({
  args: {
    kitchenId: v.id("kitchens"),
  },
  returns: v.union(
    v.object({
      kitchenId: v.id("kitchens"),
      chefId: v.id("chefs"),
      chefName: v.string(),
      kitchenName: v.string(),
      address: v.string(),
      certified: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const kitchen = await ctx.db.get(args.kitchenId);
    if (!kitchen) {
      return null;
    }

    // Find chef by userId (kitchen owner_id)
    const chef = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    if (!chef) {
      return null;
    }

    const chefName = chef.name || `Chef ${chef._id.slice(-4)}`;
    const kitchenName = `${chefName}'s Kitchen`;

    return {
      kitchenId: kitchen._id,
      chefId: chef._id,
      chefName,
      kitchenName,
      address: kitchen.address,
      certified: kitchen.certified,
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

    // Find chef by userId (kitchen owner_id)
    const chef = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", kitchen.owner_id))
      .first();

    if (!chef) {
      return [];
    }

    // Get all meals for this chef
    const meals = await ctx.db
      .query("meals")
      .filter((q) => q.eq(q.field("chefId"), chef._id))
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
