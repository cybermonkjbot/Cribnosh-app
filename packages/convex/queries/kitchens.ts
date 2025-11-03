import { query } from "../_generated/server";
import { v } from "convex/values";

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
