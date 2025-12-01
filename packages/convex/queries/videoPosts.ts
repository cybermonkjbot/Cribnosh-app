import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser, isAdmin } from "../utils/auth";

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

// Helper function to find meal by kitchenId and title match
async function findMealByKitchenAndTitle(
  ctx: any,
  kitchenId: any,
  videoTitle: string
): Promise<{ mealId: any; price: number } | null> {
  if (!kitchenId) {
    return null;
  }

  try {
    // Get kitchen to find chef
    const kitchen = await ctx.db.get(kitchenId);
    if (!kitchen) {
      return null;
    }

    // Find chef by userId (kitchen owner_id)
    const chef = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q: any) => q.eq("userId", kitchen.owner_id))
      .first();

    if (!chef) {
      return null;
    }

    // Get all available meals for this chef
    const meals = await ctx.db
      .query("meals")
      .filter((q: any) => q.eq(q.field("chefId"), chef._id))
      .filter((q: any) => q.eq(q.field("status"), "available"))
      .collect();

    if (meals.length === 0) {
      return null;
    }

    // Try to match by title (case-insensitive partial match)
    const videoTitleLower = videoTitle.toLowerCase();
    const matchedMeal = meals.find((meal: any) => {
      const mealName = meal.name?.toLowerCase() || "";
      return (
        mealName.includes(videoTitleLower) ||
        videoTitleLower.includes(mealName)
      );
    });

    if (matchedMeal && matchedMeal.price) {
      return {
        mealId: matchedMeal._id,
        price: matchedMeal.price, // Price in cents
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding meal by kitchen and title:", error);
    return null;
  }
}

// Get video feed with pagination
export const getVideoFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    status: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
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
      mealId: v.optional(v.id("meals")),
      mealPrice: v.optional(v.number()), // Price in cents
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Check if user is admin or content owner
    const user = await getAuthenticatedUser(ctx, args.sessionToken);
    const isUserAdmin = user ? isAdmin(user) : false;
    
    // Determine status filter
    const status = args.status || 'published';
    const canSeeAllStatuses = status === 'all' && isUserAdmin;
    const targetStatus = canSeeAllStatuses ? undefined : (status === 'all' ? 'published' : status);

    // Get videos with pagination
    let videosQuery;
    if (targetStatus) {
      videosQuery = ctx.db
        .query('videoPosts')
        .withIndex('by_status', q => q.eq('status', targetStatus))
        .order('desc');
    } else {
      // Fetch all videos (for admin with status='all')
      videosQuery = ctx.db
        .query('videoPosts')
        .order('desc');
    }

    if (cursor) {
      videosQuery = videosQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    let videos = await videosQuery.take(limit + 1);
    const hasMore = videos.length > limit;
    let videosToReturn = hasMore ? videos.slice(0, limit) : videos;

    // If user is not admin, filter to only show their own content or published content
    if (!isUserAdmin && user) {
      videosToReturn = videosToReturn.filter(v => 
        v.status === 'published' || v.creatorId === user._id
      );
    } else if (!isUserAdmin) {
      // Non-admin, non-authenticated users only see published content
      videosToReturn = videosToReturn.filter(v => v.status === 'published');
    }

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

        // Exclude storage IDs from the response - only return URLs
        const { videoStorageId, thumbnailStorageId, ...videoWithoutStorageIds } = video;

        // Try to find associated meal by kitchenId and title
        let mealId: any = undefined;
        let mealPrice: number | undefined = undefined;
        
        // First check if video has direct mealId link
        if (video.mealId) {
          const meal = await ctx.db.get(video.mealId);
          if (meal && meal.price) {
            mealId = video.mealId;
            mealPrice = meal.price;
          }
        } else if (video.kitchenId) {
          // Otherwise, try to match by kitchenId and title
          const mealMatch = await findMealByKitchenAndTitle(
            ctx,
            video.kitchenId,
            video.title
          );
          if (mealMatch) {
            mealId = mealMatch.mealId;
            mealPrice = mealMatch.price;
          }
        }

        return {
          ...videoWithoutStorageIds,
          videoUrl,
          thumbnailUrl,
          creator: {
            _id: creator._id,
            name: creator.name,
            avatar: creator.avatar,
            roles: creator.roles,
          },
          isLiked,
          mealId,
          mealPrice,
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
    sessionToken: v.optional(v.string()),
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
      mealId: v.optional(v.id("meals")),
      mealPrice: v.optional(v.number()), // Price in cents
  }), v.null()),
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      return null;
    }

    // Check if user is admin or content owner
    const user = await getAuthenticatedUser(ctx, args.sessionToken);
    const isUserAdmin = user ? isAdmin(user) : false;
    const isContentOwner = user && video.creatorId === user._id;
    
    // Allow access if: published, OR user is admin, OR user is content owner
    if (video.status !== 'published' && !isUserAdmin && !isContentOwner) {
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

    // Exclude storage IDs from the response - only return URLs
    const { videoStorageId, thumbnailStorageId, ...videoWithoutStorageIds } = video;

    // Try to find associated meal by kitchenId and title
    let mealId: any = undefined;
    let mealPrice: number | undefined = undefined;
    
    // First check if video has direct mealId link
    if (video.mealId) {
      const meal = await ctx.db.get(video.mealId);
      if (meal && meal.price) {
        mealId = video.mealId;
        mealPrice = meal.price;
      }
    } else if (video.kitchenId) {
      // Otherwise, try to match by kitchenId and title
      const mealMatch = await findMealByKitchenAndTitle(
        ctx,
        video.kitchenId,
        video.title
      );
      if (mealMatch) {
        mealId = mealMatch.mealId;
        mealPrice = mealMatch.price;
      }
    }

    return {
      ...videoWithoutStorageIds,
      videoUrl,
      thumbnailUrl,
      creator: {
        _id: creator._id,
        name: creator.name,
        avatar: creator.avatar,
        roles: creator.roles,
      },
      isLiked,
      mealId,
      mealPrice,
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

        // Exclude storage IDs from the response - only return URLs
        const { videoStorageId, thumbnailStorageId, ...videoWithoutStorageIds } = video;

        return {
          ...videoWithoutStorageIds,
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

// Get all videos by creator (including all statuses - for content library)
export const getAllVideosByCreator = query({
  args: {
    creatorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 1000;

    // Get all videos by creator (all statuses)
    const videos = await ctx.db
      .query('videoPosts')
      .withIndex('by_creator', q => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(limit);

    // Generate URLs from Convex storage IDs
    const videosWithUrls = await Promise.all(
      videos.map(async (video) => {
        const videoUrl = await ctx.storage.getUrl(video.videoStorageId) || '';
        const thumbnailUrl = video.thumbnailStorageId 
          ? await ctx.storage.getUrl(video.thumbnailStorageId) || undefined
          : undefined;

        // Exclude storage IDs from the response - only return URLs
        const { videoStorageId, thumbnailStorageId, ...videoWithoutStorageIds } = video;

        return {
          ...videoWithoutStorageIds,
          videoUrl,
          thumbnailUrl,
        };
      })
    );

    return {
      videos: videosWithUrls,
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

        // Exclude storage IDs from the response - only return URLs
        const { videoStorageId, thumbnailStorageId, ...videoWithoutStorageIds } = video;

        return {
          ...videoWithoutStorageIds,
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

        // Exclude storage IDs from the response - only return URLs
        const { videoStorageId, thumbnailStorageId, ...videoWithoutStorageIds } = video;

        return {
          ...videoWithoutStorageIds,
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

// Admin: Get all videos (for admin dashboard)
export const getAllVideosForAdmin = query({
  args: {
    limit: v.optional(v.number()),
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
    })),
  }),
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user || !user.roles?.includes('admin')) {
      throw new Error("Not authorized - admin access required");
    }

    // Get all videos (not just published)
    const limit = args.limit || 1000;
    const videos = await ctx.db
      .query('videoPosts')
      .order('desc')
      .take(limit);

    // Get user info for each video
    const videosWithCreator = await Promise.all(
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

        // Exclude storage IDs from the response - only return URLs
        const { videoStorageId, thumbnailStorageId, ...videoWithoutStorageIds } = video;

        return {
          ...videoWithoutStorageIds,
          videoUrl,
          thumbnailUrl,
          creator: {
            _id: creator._id,
            name: creator.name,
            avatar: creator.avatar,
            roles: creator.roles,
          },
        };
      })
    );

    return {
      videos: videosWithCreator,
    };
  },
});
