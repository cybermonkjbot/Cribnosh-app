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

      const limit = args.limit || 20;

      let chefs: any[] = [];
      let meals: any[] = [];
      let emotionBasedRecommendations: any[] = [];

      // Parse location if provided
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (args.location) {
        const locationParts = args.location.split(',');
        if (locationParts.length === 2) {
          const lat = parseFloat(locationParts[0]);
          const lng = parseFloat(locationParts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            latitude = lat;
            longitude = lng;
          }
        }
      }

      // If emotions are provided, use emotions engine to get recommendations
      if (args.emotions && args.emotions.length > 0) {
        try {
          // Get emotions engine context
          const emotionsContext = await ctx.runAction(api.actions.emotionsEngine.getEmotionsEngineContext, {
            userId: userId,
            location: latitude !== undefined && longitude !== undefined ? {
              latitude,
              longitude,
            } : undefined,
          });

          // Get time of day
          const hour = new Date().getHours();
          let timeOfDay = 'afternoon';
          if (hour >= 5 && hour < 12) timeOfDay = 'morning';
          else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
          else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
          else timeOfDay = 'night';

          // Build emotions engine request
          const emotionsRequest = {
            user_input: args.query,
            emotions: args.emotions,
            mood_score: 5, // Default neutral, could be derived from emotions
            location: args.location || 'unknown',
            timeOfDay,
            active_screen: 'search',
            device_type: 'mobile',
            user_tier: 'standard',
            searchQuery: args.query,
            userId: userId,
            nearby_cuisines: emotionsContext.nearbyCuisines || [],
            preferred_cuisine: emotionsContext.favoriteCuisines?.[0],
            recent_orders: emotionsContext.recentOrders?.map((o: any) => o.items?.map((i: any) => i.name).join(', ')).flat() || [],
            diet_type: emotionsContext.dietaryPreferences?.tags?.[0] || 'none',
          };

          // Call emotions engine API
          // Try to get API URL from environment, fallback to default
          const emotionsEngineUrl = process.env.EMOTIONS_ENGINE_URL || 
            process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/emotions-engine` :
            'http://localhost:3000/api/emotions-engine';

          try {
            const emotionsResponse = await fetch(emotionsEngineUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emotionsRequest),
            });

            if (emotionsResponse.ok) {
              const emotionsData = await emotionsResponse.json();
              if (emotionsData.success && emotionsData.data?.dishes) {
                emotionBasedRecommendations = emotionsData.data.dishes || [];
              } else if (emotionsData.success && emotionsData.data?.recommendations) {
                // If we got recommendations but not dishes, we'll need to map them
                // For now, store the recommendations to use for filtering
                emotionBasedRecommendations = emotionsData.data.recommendations || [];
              }
            }
          } catch (fetchError) {
            // If emotions engine API call fails, continue with basic search
            console.error('Emotions engine API call failed:', fetchError);
          }
        } catch (emotionsError) {
          // If emotions processing fails, continue with basic search
          console.error('Emotions processing failed:', emotionsError);
        }
      }

      // Search chefs (requires location, skip if not provided)
      if (latitude !== undefined && longitude !== undefined) {
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

      // Search dishes/meals
      const mealResults = await ctx.runQuery(api.queries.meals.search, {
        query: args.query,
        userId: userId,
        filters: args.cuisine ? { cuisine: args.cuisine } : undefined,
        limit: limit * 2, // Get more results to merge with emotion-based ones
      });
      meals = mealResults || [];

      // If we have emotion-based recommendations with dish IDs, prioritize those dishes
      if (emotionBasedRecommendations.length > 0 && emotionBasedRecommendations[0].dish_id) {
        // Map emotion-based recommendations to actual meals
        const emotionDishIds = new Set(emotionBasedRecommendations.map((r: any) => r.dish_id));
        const emotionMatchedMeals = meals.filter((meal: any) => 
          emotionDishIds.has(meal._id) || emotionDishIds.has(meal.id)
        );
        const otherMeals = meals.filter((meal: any) => 
          !emotionDishIds.has(meal._id) && !emotionDishIds.has(meal.id)
        );
        // Prioritize emotion-matched meals
        meals = [...emotionMatchedMeals, ...otherMeals].slice(0, limit);
      } else if (emotionBasedRecommendations.length > 0) {
        // If we have recommendations with item names, try to match them to meals
        const recommendationNames = emotionBasedRecommendations.map((r: any) => 
          r.item_name?.toLowerCase() || r.name?.toLowerCase()
        ).filter(Boolean);
        
        if (recommendationNames.length > 0) {
          const emotionMatchedMeals = meals.filter((meal: any) => {
            const mealName = (meal.name || '').toLowerCase();
            const mealDesc = (meal.description || '').toLowerCase();
            return recommendationNames.some((name: string) => 
              mealName.includes(name) || name.includes(mealName) || mealDesc.includes(name)
            );
          });
          const otherMeals = meals.filter((meal: any) => {
            const mealName = (meal.name || '').toLowerCase();
            const mealDesc = (meal.description || '').toLowerCase();
            return !recommendationNames.some((name: string) => 
              mealName.includes(name) || name.includes(mealName) || mealDesc.includes(name)
            );
          });
          // Prioritize emotion-matched meals
          meals = [...emotionMatchedMeals, ...otherMeals].slice(0, limit);
        }
      } else {
        // No emotion-based recommendations, just limit the results
        meals = meals.slice(0, limit);
      }

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

