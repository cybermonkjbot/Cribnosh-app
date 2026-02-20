// @ts-nocheck
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { internalMutation, mutation } from "../_generated/server";
import { isAdmin, isStaff, requireAuth } from "../utils/auth";

// Generate upload URL for video
export const generateVideoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
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

    // Check if user is a chef or food creator
    const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
    if (!isChef) {
      throw new Error("Only chefs and food creators can upload videos");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
});

// Create a new video post
export const createVideoPost = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    videoStorageId: v.id("_storage"),
    thumbnailStorageId: v.optional(v.id("_storage")),
    kitchenId: v.optional(v.id("kitchens")),
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
    visibility: v.optional(v.union(
      v.literal("public"),
      v.literal("followers"),
      v.literal("private")
    )),
    isLive: v.optional(v.boolean()),
    liveSessionId: v.optional(v.id("liveSessions")),
  },
  returns: v.id("videoPosts"),
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

    // Check if user is a chef or food creator
    const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
    if (!isChef) {
      throw new Error("Only chefs and food creators can create video posts");
    }

    const videoId = await ctx.db.insert('videoPosts', {
      creatorId: user._id,
      kitchenId: args.kitchenId,
      title: args.title,
      description: args.description,
      videoStorageId: args.videoStorageId,
      thumbnailStorageId: args.thumbnailStorageId,
      duration: args.duration,
      fileSize: args.fileSize,
      resolution: args.resolution,
      tags: args.tags,
      cuisine: args.cuisine,
      difficulty: args.difficulty,
      status: "draft",
      visibility: args.visibility || "public",
      isLive: args.isLive || false,
      liveSessionId: args.liveSessionId,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Enqueue moderation check
    await ctx.scheduler.runAfter(0, internal.mutations.jobQueue.enqueueJob, {
      jobType: "moderation_check",
      payload: {
        contentId: videoId,
        type: "video",
        text: `${args.title} ${args.description || ""}`
      },
      priority: "normal"
    });

    return videoId;
  },
});

// Create a new video post (internal version that accepts userId)
export const createVideoPostByUserId = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    videoStorageId: v.id("_storage"),
    thumbnailStorageId: v.optional(v.id("_storage")),
    kitchenId: v.optional(v.id("kitchens")),
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
    visibility: v.optional(v.union(
      v.literal("public"),
      v.literal("followers"),
      v.literal("private")
    )),
    isLive: v.optional(v.boolean()),
    liveSessionId: v.optional(v.id("liveSessions")),
  },
  returns: v.id("videoPosts"),
  handler: async (ctx, args) => {
    // Get user to verify roles
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is a chef or food creator
    const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
    if (!isChef) {
      throw new Error("Only chefs and food creators can create video posts");
    }

    const videoId = await ctx.db.insert('videoPosts', {
      creatorId: args.userId,
      kitchenId: args.kitchenId,
      title: args.title,
      description: args.description,
      videoStorageId: args.videoStorageId,
      thumbnailStorageId: args.thumbnailStorageId,
      duration: args.duration,
      fileSize: args.fileSize,
      resolution: args.resolution,
      tags: args.tags,
      cuisine: args.cuisine,
      difficulty: args.difficulty,
      status: "draft",
      visibility: args.visibility || "public",
      isLive: args.isLive || false,
      liveSessionId: args.liveSessionId,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return videoId;
  },
});

// Update video post
export const updateVideoPost = mutation({
  args: {
    videoId: v.id("videoPosts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    cuisine: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    visibility: v.optional(v.union(
      v.literal("public"),
      v.literal("followers"),
      v.literal("private")
    )),
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

    // Get video post
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video post not found");
    }

    // Check if user is the creator or admin
    const isCreator = video.creatorId === user._id;
    const isAdmin = user.roles?.includes('admin');

    if (!isCreator && !isAdmin) {
      throw new Error("Not authorized to update this video post");
    }

    // Update video post
    await ctx.db.patch(args.videoId, {
      ...(args.title && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.tags && { tags: args.tags }),
      ...(args.cuisine !== undefined && { cuisine: args.cuisine }),
      ...(args.difficulty && { difficulty: args.difficulty }),
      ...(args.visibility && { visibility: args.visibility }),
      updatedAt: Date.now(),
    });

    // Enqueue moderation check if text content changed
    if (args.title || args.description !== undefined) {
      await ctx.scheduler.runAfter(0, internal.mutations.jobQueue.enqueueJob, {
        jobType: "moderation_check",
        payload: {
          contentId: args.videoId,
          type: "video",
          text: `${args.title || video.title} ${args.description !== undefined ? args.description : (video.description || "")}`
        },
        priority: "normal"
      });
    }

    return null;
  },
});

// Publish video post
export const publishVideoPost = mutation({
  args: {
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

    // Get video post
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video post not found");
    }

    // Check if user is the creator or admin
    const isCreator = video.creatorId === user._id;
    const isAdmin = user.roles?.includes('admin');

    if (!isCreator && !isAdmin) {
      throw new Error("Not authorized to publish this video post");
    }

    // Publish video post
    await ctx.db.patch(args.videoId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Delete video post
export const deleteVideoPost = mutation({
  args: {
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

    // Get video post
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video post not found");
    }

    // Check if user is the creator or admin
    const isCreator = video.creatorId === user._id;
    const isAdmin = user.roles?.includes('admin');

    if (!isCreator && !isAdmin) {
      throw new Error("Not authorized to delete this video post");
    }

    // Soft delete by changing status
    await ctx.db.patch(args.videoId, {
      status: "removed",
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Like a video
export const likeVideo = mutation({
  args: {
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

    // Check if video exists
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query('videoLikes')
      .withIndex('by_video_user', q => q.eq('videoId', args.videoId).eq('userId', user._id))
      .first();

    if (existingLike) {
      throw new Error("Video already liked");
    }

    // Add like
    await ctx.db.insert('videoLikes', {
      videoId: args.videoId,
      userId: user._id,
      createdAt: Date.now(),
    });

    // Update video likes count
    await ctx.db.patch(args.videoId, {
      likesCount: video.likesCount + 1,
      updatedAt: Date.now(),
    });

    // Notify video creator (skip if liker is the creator)
    if (video.userId && video.userId !== user._id) {
      await ctx.db.insert('notifications', {
        userId: video.userId,
        type: 'social_like',
        title: 'New like',
        message: `${user.name} liked your video "${video.title}"`,
        data: { videoId: args.videoId, videoTitle: video.title, likerId: user._id, likerName: user.name },
        createdAt: Date.now(),
        read: false,
      });
    }

    return null;
  },
});

// Unlike a video
export const unlikeVideo = mutation({
  args: {
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

    // Check if video exists
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Find and remove like
    const existingLike = await ctx.db
      .query('videoLikes')
      .withIndex('by_video_user', q => q.eq('videoId', args.videoId).eq('userId', user._id))
      .first();

    if (!existingLike) {
      throw new Error("Video not liked");
    }

    await ctx.db.delete(existingLike._id);

    // Update video likes count
    await ctx.db.patch(args.videoId, {
      likesCount: Math.max(0, video.likesCount - 1),
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Share a video
export const shareVideo = mutation({
  args: {
    videoId: v.id("videoPosts"),
    platform: v.optional(v.union(
      v.literal("internal"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("whatsapp"),
      v.literal("other")
    )),
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

    // Check if video exists
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Add share record
    await ctx.db.insert('videoShares', {
      videoId: args.videoId,
      userId: user._id,
      platform: args.platform || "internal",
      createdAt: Date.now(),
    });

    // Update video shares count
    await ctx.db.patch(args.videoId, {
      sharesCount: video.sharesCount + 1,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Record video view
export const recordVideoView = mutation({
  args: {
    videoId: v.id("videoPosts"),
    watchDuration: v.number(),
    completionRate: v.number(),
    deviceInfo: v.optional(v.object({
      type: v.string(),
      os: v.string(),
      browser: v.string(),
    })),
    location: v.optional(v.object({
      country: v.string(),
      city: v.string(),
    })),
    sessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    let userId: Id<"users"> | undefined;
    if (identity) {
      // Get user from token
      const email = identity.tokenIdentifier.split(':')[1];
      const user = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', email))
        .first();
      userId = user?._id;
    }

    // Check if video exists
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Record view
    await ctx.db.insert('videoViews', {
      videoId: args.videoId,
      userId,
      sessionId: args.sessionId,
      watchDuration: args.watchDuration,
      completionRate: args.completionRate,
      deviceInfo: args.deviceInfo,
      location: args.location,
      createdAt: Date.now(),
    });

    // Update video views count
    await ctx.db.patch(args.videoId, {
      viewsCount: video.viewsCount + 1,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Flag video for moderation
export const flagVideo = mutation({
  args: {
    videoId: v.id("videoPosts"),
    reason: v.union(
      v.literal("inappropriate_content"),
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("violence"),
      v.literal("copyright"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
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

    // Check if video exists
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Check if already reported by this user
    const existingReport = await ctx.db
      .query('videoReports')
      .withIndex('by_video', q => q.eq('videoId', args.videoId))
      .filter(q => q.eq(q.field('reporterId'), user._id))
      .first();

    if (existingReport) {
      throw new Error("Video already reported by you");
    }

    // Create report
    const reportId = await ctx.db.insert('videoReports', {
      videoId: args.videoId,
      reporterId: user._id,
      reason: args.reason,
      description: args.description,
      status: "pending",
      createdAt: Date.now(),
    });

    // Enqueue report alert
    await ctx.scheduler.runAfter(0, internal.mutations.jobQueue.enqueueJob, {
      jobType: "report_alert",
      payload: {
        reportId,
        videoId: args.videoId,
        reason: args.reason,
        severity: (args.reason === "violence" || args.reason === "harassment") ? "high" : "normal"
      },
      priority: "high"
    });

    return null;
  },
});

// Admin: Resolve video report
export const resolveVideoReport = mutation({
  args: {
    reportId: v.id("videoReports"),
    status: v.union(
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    resolutionNotes: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);

    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error("Unauthorized: Admin or staff access required");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      return {
        success: false,
        message: "Report not found",
      };
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
    });

    // Enqueue creator evaluation if report is resolved (violation confirmed)
    if (args.status === "resolved") {
      const video = await ctx.db.get(report.videoId);
      if (video) {
        await ctx.scheduler.runAfter(0, internal.mutations.jobQueue.enqueueJob, {
          jobType: "evaluate_creator",
          payload: { chefId: video.creatorId },
          priority: "low"
        });
      }
    }

    return {
      success: true,
      message: `Video report ${args.status} successfully`,
    };
  },
});

// Publish video post (internal version for seeding)
// This bypasses authentication checks for use in seed actions
export const publishVideoPostForSeed = internalMutation({
  args: {
    videoId: v.id("videoPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get video post
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video post not found");
    }

    // Publish video post
    await ctx.db.patch(args.videoId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal version of updateVideoPost for system actions
export const updateVideoPostInternal = internalMutation({
  args: {
    videoId: v.id("videoPosts"),
    status: v.optional(v.string()),
    moderationNote: v.optional(v.string()),
    updates: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { videoId, status, moderationNote, updates } = args;
    await ctx.db.patch(videoId, {
      ...(status && { status }),
      ...(moderationNote && { moderationNote }),
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
