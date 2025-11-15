"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Helper to authenticate user from session token
 */
async function authenticateUser(ctx: any, sessionToken: string) {
  const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
    sessionToken,
  });
  return user?._id || null;
}

/**
 * Customer Search With Emotions - for mobile app direct Convex communication
 */
export const customerSearchWithEmotions = action({
  args: {
    sessionToken: v.string(),
    query: v.string(),
    emotions: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    cuisine: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      results: v.array(v.any()),
      chefs: v.array(v.any()),
      dishes: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // TODO: Implement emotion-based search logic
      // For now, return basic search results
      const limit = args.limit || 20;

      let chefs: any[] = [];
      let meals: any[] = [];

      // Search chefs (requires location, skip if not provided)
      if (args.location) {
        // Parse location if it's a string like "lat,lng"
        const locationParts = args.location.split(',');
        if (locationParts.length === 2) {
          const latitude = parseFloat(locationParts[0]);
          const longitude = parseFloat(locationParts[1]);
          if (!isNaN(latitude) && !isNaN(longitude)) {
            const chefResults = await ctx.runQuery(api.queries.chefs.searchChefsByQuery, {
              query: args.query,
              latitude,
              longitude,
              radiusKm: 50, // Default 50km radius
              cuisine: args.cuisine,
              limit,
            });
            chefs = chefResults?.chefs || [];
          }
        }
      }

      // Search dishes/meals
      const mealResults = await ctx.runQuery(api.queries.meals.search, {
        query: args.query,
        userId: userId,
        filters: args.cuisine ? { cuisine: args.cuisine } : undefined,
        limit,
      });
      meals = mealResults || [];

      return {
        success: true as const,
        results: [],
        chefs,
        dishes: meals,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to search';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Video Feed - for mobile app direct Convex communication
 */
export const customerGetVideoFeed = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      videos: v.array(v.any()),
      nextCursor: v.optional(v.string()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const result = await ctx.runQuery(api.queries.videoPosts.getVideoFeed, {
        limit: args.limit || 20,
        cursor: args.cursor,
      });

      return {
        success: true as const,
        videos: result.videos || [],
        nextCursor: result.nextCursor,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get video feed';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Like Video - for mobile app direct Convex communication
 */
export const customerLikeVideo = action({
  args: {
    sessionToken: v.string(),
    videoId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      await ctx.runMutation(api.mutations.videoPosts.likeVideo, {
        videoId: args.videoId as any,
      });

      return { success: true as const };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to like video';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Unlike Video - for mobile app direct Convex communication
 */
export const customerUnlikeVideo = action({
  args: {
    sessionToken: v.string(),
    videoId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      await ctx.runMutation(api.mutations.videoPosts.unlikeVideo, {
        videoId: args.videoId as any,
      });

      return { success: true as const };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to unlike video';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Share Video - for mobile app direct Convex communication
 */
export const customerShareVideo = action({
  args: {
    sessionToken: v.string(),
    videoId: v.string(),
    platform: v.optional(v.union(
      v.literal("internal"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("whatsapp"),
      v.literal("other")
    )),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      await ctx.runMutation(api.mutations.videoPosts.shareVideo, {
        videoId: args.videoId as any,
        platform: args.platform,
      });

      return { success: true as const };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to share video';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Record Video View - for mobile app direct Convex communication
 */
export const customerRecordVideoView = action({
  args: {
    sessionToken: v.string(),
    videoId: v.string(),
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
  returns: v.union(
    v.object({
      success: v.literal(true),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      // Note: userId can be null for anonymous views

      await ctx.runMutation(api.mutations.videoPosts.recordVideoView, {
        videoId: args.videoId as any,
        watchDuration: args.watchDuration,
        completionRate: args.completionRate,
        deviceInfo: args.deviceInfo,
        location: args.location,
        sessionId: args.sessionId,
      });

      return { success: true as const };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to record video view';
      return { success: false as const, error: errorMessage };
    }
  },
});

