// @ts-nocheck
import { query } from "../_generated/server";
import { v } from "convex/values";

// Get collections with pagination
export const getCollections = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    publicOnly: v.optional(v.boolean()),
  },
  returns: v.object({
    collections: v.array(v.object({
      _id: v.id("videoCollections"),
      _creationTime: v.number(),
      creatorId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      isPublic: v.boolean(),
      videoIds: v.array(v.id("videoPosts")),
      coverImageUrl: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      creator: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatar: v.optional(v.string()),
        roles: v.optional(v.array(v.string())),
      }),
      videos: v.array(v.union(v.object({
        _id: v.id("videoPosts"),
        title: v.string(),
        thumbnailUrl: v.optional(v.string()),
        duration: v.number(),
        viewsCount: v.number(),
        likesCount: v.number(),
      }), v.null())),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;
    const publicOnly = args.publicOnly !== false; // Default to true

    // Get collections
    let collectionsQuery = ctx.db
      .query('videoCollections')
      .order('desc');

    if (publicOnly) {
      collectionsQuery = collectionsQuery.filter(q => q.eq(q.field('isPublic'), true));
    }

    if (cursor) {
      collectionsQuery = collectionsQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const collections = await collectionsQuery.take(limit + 1);
    const hasMore = collections.length > limit;
    const collectionsToReturn = hasMore ? collections.slice(0, limit) : collections;

    // Get creator info and videos for each collection
    const collectionsWithDetails = await Promise.all(
      collectionsToReturn.map(async (collection) => {
        const creator = await ctx.db.get(collection.creatorId);
        if (!creator) {
          throw new Error("Creator not found");
        }

        // Get video details
        const videos = await Promise.all(
          collection.videoIds.map(async (videoId) => {
            const video = await ctx.db.get(videoId);
            if (!video) return null;
            return {
              _id: video._id,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              duration: video.duration,
              viewsCount: video.viewsCount,
              likesCount: video.likesCount,
            };
          })
        );

        return {
          ...collection,
          creator: {
            _id: creator._id,
            name: creator.name,
            avatar: creator.avatar,
            roles: creator.roles,
          },
          videos: videos.filter(v => v !== null),
        };
      })
    );

    const nextCursor = hasMore ? collectionsToReturn[collectionsToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      collections: collectionsWithDetails,
      nextCursor,
    };
  },
});

// Get collection by ID
export const getCollectionById = query({
  args: {
    collectionId: v.id("videoCollections"),
  },
  returns: v.union(v.object({
    _id: v.id("videoCollections"),
    _creationTime: v.number(),
    creatorId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    videoIds: v.array(v.id("videoPosts")),
    coverImageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    creator: v.object({
      _id: v.id("users"),
      name: v.string(),
      avatar: v.optional(v.string()),
      roles: v.optional(v.array(v.string())),
    }),
    videos: v.array(v.union(v.object({
      _id: v.id("videoPosts"),
      title: v.string(),
      description: v.optional(v.string()),
      videoUrl: v.string(),
      thumbnailUrl: v.optional(v.string()),
      duration: v.number(),
      viewsCount: v.number(),
      likesCount: v.number(),
      commentsCount: v.number(),
      tags: v.array(v.string()),
      cuisine: v.optional(v.string()),
      difficulty: v.optional(v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )),
      createdAt: v.number(),
    }), v.null())),
  }), v.null()),
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      return null;
    }

    // Get creator info
    const creator = await ctx.db.get(collection.creatorId);
    if (!creator) {
      throw new Error("Creator not found");
    }

    // Get video details
    const videos = await Promise.all(
      collection.videoIds.map(async (videoId) => {
        const video = await ctx.db.get(videoId);
        if (!video) return null;
        return {
          _id: video._id,
          title: video.title,
          description: video.description,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewsCount: video.viewsCount,
          likesCount: video.likesCount,
          commentsCount: video.commentsCount,
          tags: video.tags,
          cuisine: video.cuisine,
          difficulty: video.difficulty,
          createdAt: video.createdAt,
        };
      })
    );

    return {
      ...collection,
      creator: {
        _id: creator._id,
        name: creator.name,
        avatar: creator.avatar,
        roles: creator.roles,
      },
      videos: videos.filter(v => v !== null),
    };
  },
});

// Get collections by creator
export const getCollectionsByCreator = query({
  args: {
    creatorId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    collections: v.array(v.object({
      _id: v.id("videoCollections"),
      _creationTime: v.number(),
      creatorId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      isPublic: v.boolean(),
      videoIds: v.array(v.id("videoPosts")),
      coverImageUrl: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      videos: v.array(v.union(v.object({
        _id: v.id("videoPosts"),
        title: v.string(),
        thumbnailUrl: v.optional(v.string()),
        duration: v.number(),
        viewsCount: v.number(),
        likesCount: v.number(),
      }), v.null())),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get collections by creator
    let collectionsQuery = ctx.db
      .query('videoCollections')
      .withIndex('by_creator', q => q.eq('creatorId', args.creatorId))
      .order('desc');

    if (cursor) {
      collectionsQuery = collectionsQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const collections = await collectionsQuery.take(limit + 1);
    const hasMore = collections.length > limit;
    const collectionsToReturn = hasMore ? collections.slice(0, limit) : collections;

    // Get video details for each collection
    const collectionsWithVideos = await Promise.all(
      collectionsToReturn.map(async (collection) => {
        const videos = await Promise.all(
          collection.videoIds.map(async (videoId) => {
            const video = await ctx.db.get(videoId);
            if (!video) return null;
            return {
              _id: video._id,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              duration: video.duration,
              viewsCount: video.viewsCount,
              likesCount: video.likesCount,
            };
          })
        );

        return {
          ...collection,
          videos: videos.filter(v => v !== null),
        };
      })
    );

    const nextCursor = hasMore ? collectionsToReturn[collectionsToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      collections: collectionsWithVideos,
      nextCursor,
    };
  },
});
