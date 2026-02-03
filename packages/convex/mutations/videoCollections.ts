// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Create a new video collection
export const createCollection = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    videoIds: v.array(v.id("videoPosts")),
    coverImageUrl: v.optional(v.string()),
  },
  returns: v.id("videoCollections"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify all videos exist and are published
    for (const videoId of args.videoIds) {
      const video = await ctx.db.get(videoId);
      if (!video) {
        throw new Error(`Video ${videoId} not found`);
      }
      if (video.status !== 'published') {
        throw new Error(`Video ${videoId} is not published`);
      }
    }

    const collectionId = await ctx.db.insert('videoCollections', {
      creatorId: user._id,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic,
      videoIds: args.videoIds,
      coverImageUrl: args.coverImageUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return collectionId;
  },
});

// Update video collection
export const updateCollection = mutation({
  args: {
    collectionId: v.id("videoCollections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    videoIds: v.optional(v.array(v.id("videoPosts"))),
    coverImageUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get collection
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Check if user is the creator or admin
    const isCreator = collection.creatorId === user._id;
    const isAdmin = user.roles?.includes('admin');
    
    if (!isCreator && !isAdmin) {
      throw new Error("Not authorized to update this collection");
    }

    // Verify videos if provided
    if (args.videoIds) {
      for (const videoId of args.videoIds) {
        const video = await ctx.db.get(videoId);
        if (!video) {
          throw new Error(`Video ${videoId} not found`);
        }
        if (video.status !== 'published') {
          throw new Error(`Video ${videoId} is not published`);
        }
      }
    }

    // Update collection
    await ctx.db.patch(args.collectionId, {
      ...(args.name && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
      ...(args.videoIds && { videoIds: args.videoIds }),
      ...(args.coverImageUrl !== undefined && { coverImageUrl: args.coverImageUrl }),
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Delete video collection
export const deleteCollection = mutation({
  args: {
    collectionId: v.id("videoCollections"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get collection
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Check if user is the creator or admin
    const isCreator = collection.creatorId === user._id;
    const isAdmin = user.roles?.includes('admin');
    
    if (!isCreator && !isAdmin) {
      throw new Error("Not authorized to delete this collection");
    }

    // Delete collection
    await ctx.db.delete(args.collectionId);

    return null;
  },
});

// Add video to collection
export const addVideoToCollection = mutation({
  args: {
    collectionId: v.id("videoCollections"),
    videoId: v.id("videoPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get collection
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Check if user is the creator or admin
    const isCreator = collection.creatorId === user._id;
    const isAdmin = user.roles?.includes('admin');
    
    if (!isCreator && !isAdmin) {
      throw new Error("Not authorized to modify this collection");
    }

    // Check if video exists and is published
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }
    if (video.status !== 'published') {
      throw new Error("Video is not published");
    }

    // Check if video is already in collection
    if (collection.videoIds.includes(args.videoId)) {
      throw new Error("Video already in collection");
    }

    // Add video to collection
    await ctx.db.patch(args.collectionId, {
      videoIds: [...collection.videoIds, args.videoId],
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Remove video from collection
export const removeVideoFromCollection = mutation({
  args: {
    collectionId: v.id("videoCollections"),
    videoId: v.id("videoPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get collection
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Check if user is the creator or admin
    const isCreator = collection.creatorId === user._id;
    const isAdmin = user.roles?.includes('admin');
    
    if (!isCreator && !isAdmin) {
      throw new Error("Not authorized to modify this collection");
    }

    // Remove video from collection
    await ctx.db.patch(args.collectionId, {
      videoIds: collection.videoIds.filter(id => id !== args.videoId),
      updatedAt: Date.now(),
    });

    return null;
  },
});
