import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Helper: Get video URL from storage ID
export const getVideoUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.storageId);
      return url;
    } catch (error) {
      console.error('Failed to get video URL:', error);
      return null;
    }
  },
});

// Helper: Get thumbnail URL from storage ID
export const getThumbnailUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.storageId);
      return url;
    } catch (error) {
      console.error('Failed to get thumbnail URL:', error);
      return null;
    }
  },
});

// Get video feed with pagination
export const getVideoFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    videos: v.array(v.object({
      _id: v.id("videoPosts"),
      _creationTime: v.number(),
      creatorId: v.id("users"),
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
      isLiked: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get videos with pagination
    let videosQuery = ctx.db
      .query('videoPosts')
      .withIndex('by_status', q => q.eq('status', 'published'))
      .order('desc');

    if (cursor) {
      videosQuery = videosQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const videos = await videosQuery.take(limit + 1);
    const hasMore = videos.length > limit;
    const videosToReturn = hasMore ? videos.slice(0, limit) : videos;

    // Get user info for each video
    const videosWithCreator = await Promise.all(
      videosToReturn.map(async (video) => {
        const creator = await ctx.db.get(video.creatorId);
        if (!creator) {
          throw new Error("Creator not found");
        }

        // Generate URLs from Convex storage IDs
        const videoUrl = await ctx.storage.getUrl(video.videoStorageId) || '';
        const thumbnailUrl = video.thumbnailStorageId 
          ? await ctx.storage.getUrl(video.thumbnailStorageId) || undefined
          : undefined;

        // Check if current user liked this video
        let isLiked = false;
        try {
          const identity = await ctx.auth.getUserIdentity();
          if (identity) {
            const email = identity.tokenIdentifier.split(':')[1];
            const user = await ctx.db
              .query('users')
              .withIndex('by_email', q => q.eq('email', email))
              .first();
            
            if (user) {
              const like = await ctx.db
                .query('videoLikes')
                .withIndex('by_video_user', q => q.eq('videoId', video._id).eq('userId', user._id))
                .first();
              isLiked = !!like;
            }
          }
        } catch (error) {
          // Ignore auth errors for anonymous users
        }

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
          isLiked,
        };
      })
    );

    const nextCursor = hasMore ? videosToReturn[videosToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      videos: videosWithCreator,
      nextCursor,
    };
  },
});

// Get video by ID
export const getVideoById = query({
  args: {
    videoId: v.id("videoPosts"),
  },
  returns: v.union(v.object({
    _id: v.id("videoPosts"),
    _creationTime: v.number(),
    creatorId: v.id("users"),
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
    isLiked: v.boolean(),
  }), v.null()),
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
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

    // Check if current user liked this video
    let isLiked = false;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const email = identity.tokenIdentifier.split(':')[1];
        const user = await ctx.db
          .query('users')
          .withIndex('by_email', q => q.eq('email', email))
          .first();
        
        if (user) {
          const like = await ctx.db
            .query('videoLikes')
            .withIndex('by_video_user', q => q.eq('videoId', video._id).eq('userId', user._id))
            .first();
          isLiked = !!like;
        }
      }
    } catch (error) {
      // Ignore auth errors for anonymous users
    }

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
      isLiked,
    };
  },
});

// Get videos by creator
export const getVideosByCreator = query({
  args: {
    creatorId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    videos: v.array(v.object({
      _id: v.id("videoPosts"),
      _creationTime: v.number(),
      creatorId: v.id("users"),
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
      isLiked: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get videos by creator
    let videosQuery = ctx.db
      .query('videoPosts')
      .withIndex('by_creator', q => q.eq('creatorId', args.creatorId))
      .filter(q => q.eq(q.field('status'), 'published'))
      .order('desc');

    if (cursor) {
      videosQuery = videosQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const videos = await videosQuery.take(limit + 1);
    const hasMore = videos.length > limit;
    const videosToReturn = hasMore ? videos.slice(0, limit) : videos;

    // Check if current user liked each video and generate URLs
    const videosWithLikes = await Promise.all(
      videosToReturn.map(async (video) => {
        // Generate URLs from Convex storage IDs
        const videoUrl = await ctx.storage.getUrl(video.videoStorageId) || '';
        const thumbnailUrl = video.thumbnailStorageId 
          ? await ctx.storage.getUrl(video.thumbnailStorageId) || undefined
          : undefined;

        let isLiked = false;
        try {
          const identity = await ctx.auth.getUserIdentity();
          if (identity) {
            const email = identity.tokenIdentifier.split(':')[1];
            const user = await ctx.db
              .query('users')
              .withIndex('by_email', q => q.eq('email', email))
              .first();
            
            if (user) {
              const like = await ctx.db
                .query('videoLikes')
                .withIndex('by_video_user', q => q.eq('videoId', video._id).eq('userId', user._id))
                .first();
              isLiked = !!like;
            }
          }
        } catch (error) {
          // Ignore auth errors for anonymous users
        }

        return {
          ...video,
          videoUrl,
          thumbnailUrl,
          isLiked,
        };
      })
    );

    const nextCursor = hasMore ? videosToReturn[videosToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      videos: videosWithLikes,
      nextCursor,
    };
  },
});

// Search videos
export const searchVideos = query({
  args: {
    query: v.string(),
    cuisine: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    videos: v.array(v.object({
      _id: v.id("videoPosts"),
      _creationTime: v.number(),
      creatorId: v.id("users"),
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
      isLiked: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;
    const searchQuery = args.query.toLowerCase();

    // Get all published videos
    let videosQuery = ctx.db
      .query('videoPosts')
      .withIndex('by_status', q => q.eq('status', 'published'))
      .order('desc');

    if (cursor) {
      videosQuery = videosQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const allVideos = await videosQuery.collect();

    // Filter videos based on search criteria
    let filteredVideos = allVideos.filter(video => {
      // Text search in title and description
      const matchesText = video.title.toLowerCase().includes(searchQuery) ||
                         (video.description && video.description.toLowerCase().includes(searchQuery)) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchQuery));

      // Cuisine filter
      const matchesCuisine = !args.cuisine || video.cuisine === args.cuisine;

      // Difficulty filter
      const matchesDifficulty = !args.difficulty || video.difficulty === args.difficulty;

      // Tags filter
      const matchesTags = !args.tags || args.tags.every(tag => video.tags.includes(tag));

      return matchesText && matchesCuisine && matchesDifficulty && matchesTags;
    });

    // Apply pagination
    const hasMore = filteredVideos.length > limit;
    const videosToReturn = hasMore ? filteredVideos.slice(0, limit) : filteredVideos;

    // Get user info and likes for each video
    const videosWithDetails = await Promise.all(
      videosToReturn.map(async (video) => {
        const creator = await ctx.db.get(video.creatorId);
        if (!creator) {
          throw new Error("Creator not found");
        }

        // Generate URLs from Convex storage IDs
        const videoUrl = await ctx.storage.getUrl(video.videoStorageId) || '';
        const thumbnailUrl = video.thumbnailStorageId 
          ? await ctx.storage.getUrl(video.thumbnailStorageId) || undefined
          : undefined;

        let isLiked = false;
        try {
          const identity = await ctx.auth.getUserIdentity();
          if (identity) {
            const email = identity.tokenIdentifier.split(':')[1];
            const user = await ctx.db
              .query('users')
              .withIndex('by_email', q => q.eq('email', email))
              .first();
            
            if (user) {
              const like = await ctx.db
                .query('videoLikes')
                .withIndex('by_video_user', q => q.eq('videoId', video._id).eq('userId', user._id))
                .first();
              isLiked = !!like;
            }
          }
        } catch (error) {
          // Ignore auth errors for anonymous users
        }

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
          isLiked,
        };
      })
    );

    const nextCursor = hasMore ? videosToReturn[videosToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      videos: videosWithDetails,
      nextCursor,
    };
  },
});

// Get trending videos
export const getTrendingVideos = query({
  args: {
    limit: v.optional(v.number()),
    timeRange: v.optional(v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("all")
    )),
  },
  returns: v.array(v.object({
    _id: v.id("videoPosts"),
    _creationTime: v.number(),
    creatorId: v.id("users"),
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
    isLiked: v.boolean(),
    engagementScore: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const timeRange = args.timeRange || "7d";

    // Calculate time filter
    const now = Date.now();
    let timeFilter: number;
    switch (timeRange) {
      case "24h":
        timeFilter = now - (24 * 60 * 60 * 1000);
        break;
      case "7d":
        timeFilter = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        timeFilter = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeFilter = 0;
    }

    // Get videos with time filter
    let videosQuery = ctx.db
      .query('videoPosts')
      .withIndex('by_status', q => q.eq('status', 'published'))
      .filter(q => q.gte(q.field('publishedAt'), timeFilter))
      .order('desc');

    const videos = await videosQuery.take(limit * 2); // Get more to calculate engagement

    // Calculate engagement score and get creator info
    const videosWithEngagement = await Promise.all(
      videos.map(async (video) => {
        const creator = await ctx.db.get(video.creatorId);
        if (!creator) {
          throw new Error("Creator not found");
        }

        // Generate URLs from Convex storage IDs
        const videoUrl = await ctx.storage.getUrl(video.videoStorageId) || '';
        const thumbnailUrl = video.thumbnailStorageId 
          ? await ctx.storage.getUrl(video.thumbnailStorageId) || undefined
          : undefined;

        // Calculate engagement score (likes + comments + shares) / views
        const engagementScore = video.viewsCount > 0 
          ? (video.likesCount + video.commentsCount + video.sharesCount) / video.viewsCount
          : 0;

        let isLiked = false;
        try {
          const identity = await ctx.auth.getUserIdentity();
          if (identity) {
            const email = identity.tokenIdentifier.split(':')[1];
            const user = await ctx.db
              .query('users')
              .withIndex('by_email', q => q.eq('email', email))
              .first();
            
            if (user) {
              const like = await ctx.db
                .query('videoLikes')
                .withIndex('by_video_user', q => q.eq('videoId', video._id).eq('userId', user._id))
                .first();
              isLiked = !!like;
            }
          }
        } catch (error) {
          // Ignore auth errors for anonymous users
        }

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
          isLiked,
          engagementScore,
        };
      })
    );

    // Sort by engagement score and return top videos
    return videosWithEngagement
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);
  },
});
