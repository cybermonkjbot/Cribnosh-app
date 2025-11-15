// @ts-nocheck - Disable type checking to avoid TS2589 "Type instantiation is excessively deep" errors
// This is necessary due to complex nested validators in Convex actions
"use node";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

// Helper to authenticate user and verify customer role
async function authenticateUser(ctx: any, sessionToken: string): Promise<Id<'users'> | null> {
  const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
    sessionToken,
  });
  if (!user || !user.roles?.includes('customer')) {
    return null;
  }
  return user._id;
}

// Helper to normalize kitchen ID - converts chef ID to kitchen ID if needed
async function normalizeKitchenId(ctx: any, id: string): Promise<Id<'kitchens'> | null> {
  // Try as kitchen ID first
  try {
    const kitchenId = id as Id<'kitchens'>;
    const kitchen = await ctx.runQuery(api.queries.kitchens.getKitchenDetails, {
      kitchenId,
    });
    if (kitchen) {
      return kitchenId;
    }
  } catch (error: any) {
    // If validation error indicates it's a chef ID, try conversion
    const errorMessage = error?.message || '';
    if (errorMessage.includes('chefs') && errorMessage.includes('does not match')) {
      try {
        const chefId = id as Id<'chefs'>;
        const kitchenId = await ctx.runQuery(api.queries.kitchens.getKitchenByChefId, {
          chefId,
        });
        return kitchenId;
      } catch (conversionError) {
        return null;
      }
    }
    // If it's a different error (like kitchen not found), still try chef ID conversion
    // as the ID might be a chef ID
  }
  
  // If kitchen ID lookup failed (returned null or error), try chef ID conversion
  try {
    const chefId = id as Id<'chefs'>;
    const kitchenId = await ctx.runQuery(api.queries.kitchens.getKitchenByChefId, {
      chefId,
    });
    return kitchenId;
  } catch (error) {
    // If both fail, return null
    return null;
  }
}

/**
 * Customer Get Nearby Chefs - for mobile app direct Convex communication
 */
export const customerGetNearbyChefs = action({
  args: {
    sessionToken: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chefs: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const radiusKm = args.radius || 5;
      const limit = args.limit || 20;
      const page = args.page || 1;

      // Get chefs by location
      const result = await ctx.runQuery(api.queries.chefs.getChefsByLocation, {
        latitude: args.latitude,
        longitude: args.longitude,
        radiusKm,
        limit,
        page,
      });

      // Transform to match API format
      const chefs = result.chefs.map((chef: any) => ({
        id: chef._id,
        name: chef.name,
        bio: chef.bio,
        specialties: chef.specialties || [],
        rating: chef.rating || 0,
        location: {
          latitude: chef.location?.coordinates?.[0] || 0,
          longitude: chef.location?.coordinates?.[1] || 0,
          address: chef.location?.address || '',
          city: chef.location?.city || '',
        },
        distance: chef.distance || 0,
        profileImage: chef.profileImage,
        isAvailable: chef.isAvailable,
        status: chef.status,
      }));

      return {
        success: true as const,
        chefs,
        total: result.total,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get nearby chefs';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Chef Details - for mobile app direct Convex communication
 */
export const customerGetChefDetails = action({
  args: {
    sessionToken: v.string(),
    chef_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chef: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get chef details
      const chef = await ctx.runQuery(api.queries.chefs.getById, {
        chefId: args.chef_id as Id<'chefs'>,
      });

      if (!chef) {
        return { success: false as const, error: 'Chef not found' };
      }

      // Transform to match API format
      const chefData = {
        id: chef._id,
        name: chef.name,
        bio: chef.bio,
        specialties: chef.specialties || [],
        rating: chef.rating || 0,
        location: {
          latitude: chef.location?.coordinates?.[0] || 0,
          longitude: chef.location?.coordinates?.[1] || 0,
          address: chef.location?.address || '',
          city: chef.location?.city || '',
        },
        profileImage: chef.profileImage,
        isAvailable: chef.isAvailable,
        status: chef.status,
        availableDays: chef.availableDays,
        availableHours: chef.availableHours,
        maxOrdersPerDay: chef.maxOrdersPerDay,
        advanceBookingDays: chef.advanceBookingDays,
        specialInstructions: chef.specialInstructions,
        performance: chef.performance,
      };

      return {
        success: true as const,
        chef: chefData,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get chef details';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Search Chefs - for mobile app direct Convex communication
 */
export const customerSearchChefs = action({
  args: {
    sessionToken: v.string(),
    q: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    radius: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chefs: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // If location is provided, use search with location
      if (args.latitude && args.longitude) {
        const radiusKm = args.radius || 10;
        const limit = args.limit || 20;

        const result = await ctx.runQuery(api.queries.chefs.searchChefsByQuery, {
          query: args.q,
          latitude: args.latitude,
          longitude: args.longitude,
          radiusKm,
          limit,
        });

        // Transform to match API format
        const chefs = result.chefs.map((chef: any) => ({
          id: chef._id,
          name: chef.name,
          bio: chef.bio,
          specialties: chef.specialties || [],
          rating: chef.rating || 0,
          location: {
            latitude: chef.location?.coordinates?.[0] || 0,
            longitude: chef.location?.coordinates?.[1] || 0,
            address: chef.location?.address || '',
            city: chef.location?.city || '',
          },
          distance: chef.distance || 0,
          profileImage: chef.profileImage,
          isAvailable: chef.isAvailable,
          status: chef.status,
        }));

        return {
          success: true as const,
          chefs,
          total: result.total,
        };
      } else {
        // Simple search without location (search all chefs)
        // This is a simplified version - you might want to enhance this
        const allChefs = await ctx.runQuery(api.queries.chefs.getAll, {});
        const queryLower = args.q.toLowerCase();
        
        const filteredChefs = allChefs
          .filter((chef: any) => 
            chef.name?.toLowerCase().includes(queryLower) ||
            chef.bio?.toLowerCase().includes(queryLower) ||
            chef.specialties?.some((s: string) => s.toLowerCase().includes(queryLower)) ||
            chef.location?.city?.toLowerCase().includes(queryLower)
          )
          .slice(0, args.limit || 20);

        const chefs = filteredChefs.map((chef: any) => ({
          id: chef._id,
          name: chef.name,
          bio: chef.bio,
          specialties: chef.specialties || [],
          rating: chef.rating || 0,
          location: {
            latitude: chef.location?.coordinates?.[0] || 0,
            longitude: chef.location?.coordinates?.[1] || 0,
            address: chef.location?.address || '',
            city: chef.location?.city || '',
          },
          profileImage: chef.profileImage,
          isAvailable: chef.isAvailable,
          status: chef.status,
        }));

        return {
          success: true as const,
          chefs,
          total: filteredChefs.length,
        };
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to search chefs';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Popular Chefs - for mobile app direct Convex communication
 */
export const customerGetPopularChefs = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chefs: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get top rated chefs
      const topChefs = await ctx.runQuery(api.queries.chefs.getTopRatedChefs, {
        limit: args.limit || 10,
      });

      // Transform to match API format
      const chefs = topChefs.map((chef: any) => ({
        id: chef._id,
        name: chef.name,
        bio: chef.bio,
        specialties: chef.specialties || [],
        rating: chef.rating || 0,
        location: {
          latitude: chef.location?.coordinates?.[0] || 0,
          longitude: chef.location?.coordinates?.[1] || 0,
          address: chef.location?.address || '',
          city: chef.location?.city || '',
        },
        profileImage: chef.profileImage,
        isAvailable: chef.isAvailable,
        status: chef.status,
      }));

      return {
        success: true as const,
        chefs,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get popular chefs';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Featured Kitchens - for mobile app direct Convex communication
 */
export const customerGetFeaturedKitchens = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      kitchens: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // For now, return top rated chefs as featured kitchens
      // You might want to add a "featured" flag to the chefs schema
      const topChefs = await ctx.runQuery(api.queries.chefs.getTopRatedChefs, {
        limit: args.limit || 10,
      });

      // Transform to match API format
      const kitchens = topChefs.map((chef: any) => ({
        id: chef._id,
        name: chef.name,
        bio: chef.bio,
        specialties: chef.specialties || [],
        rating: chef.rating || 0,
        location: {
          latitude: chef.location?.coordinates?.[0] || 0,
          longitude: chef.location?.coordinates?.[1] || 0,
          address: chef.location?.address || '',
          city: chef.location?.city || '',
        },
        profileImage: chef.profileImage,
        isAvailable: chef.isAvailable,
        status: chef.status,
      }));

      return {
        success: true as const,
        kitchens,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get featured kitchens';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Toggle Kitchen Favorite - for mobile app direct Convex communication
 */
export const customerToggleKitchenFavorite = action({
  args: {
    sessionToken: v.string(),
    kitchen_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      is_favorite: v.boolean(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Toggle favorite
      const result = await ctx.runMutation(api.mutations.userFavorites.toggleFavorite, {
        userId,
        chefId: args.kitchen_id as Id<'chefs'>,
      });

      return {
        success: true as const,
        is_favorite: result.isFavorited,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to toggle favorite';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Kitchen Details - for mobile app direct Convex communication
 */
export const customerGetKitchenDetails = action({
  args: {
    sessionToken: v.string(),
    kitchenId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      kitchen: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Normalize kitchen ID (convert chef ID to kitchen ID if needed)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get kitchen details
      const kitchenDetails = await ctx.runQuery(api.queries.kitchens.getKitchenDetails, {
        kitchenId,
      });

      if (!kitchenDetails) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      return {
        success: true as const,
        kitchen: {
          kitchenId: kitchenDetails.kitchenId,
          chefId: kitchenDetails.chefId,
          chefName: kitchenDetails.chefName,
          kitchenName: kitchenDetails.kitchenName,
          address: kitchenDetails.address,
          certified: kitchenDetails.certified,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get kitchen details';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Kitchen Featured Video - for mobile app direct Convex communication
 */
export const customerGetKitchenFeaturedVideo = action({
  args: {
    sessionToken: v.string(),
    kitchenId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      video: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Normalize kitchen ID (convert chef ID to kitchen ID if needed)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get featured video
      const video = await ctx.runQuery(api.queries.kitchens.getFeaturedVideo, {
        kitchenId,
      });

      if (!video) {
        return { success: false as const, error: 'Featured video not found' };
      }

      return {
        success: true as const,
        video: {
          _id: video._id,
          title: video.title,
          description: video.description,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          creator: video.creator,
          viewsCount: video.viewsCount,
          likesCount: video.likesCount,
          commentsCount: video.commentsCount,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get featured video';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Kitchen Categories - for mobile app direct Convex communication
 */
export const customerGetKitchenCategories = action({
  args: {
    sessionToken: v.string(),
    kitchenId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      categories: v.array(v.object({
        category: v.string(),
        count: v.number(),
      })),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Normalize kitchen ID (convert chef ID to kitchen ID if needed)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get chefId from kitchenId
      const chefId = await ctx.runQuery(api.queries.kitchens.getChefByKitchenId, {
        kitchenId,
      });

      if (!chefId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get categories by chefId
      const categories = await ctx.runQuery(api.queries.meals.getCategoriesByChefId, {
        chefId,
      });

      return {
        success: true as const,
        categories: categories || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get kitchen categories';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Kitchen Tags - for mobile app direct Convex communication
 */
export const customerGetKitchenTags = action({
  args: {
    sessionToken: v.string(),
    kitchenId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      tags: v.array(v.object({
        tag: v.string(),
        count: v.number(),
      })),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Normalize kitchen ID (convert chef ID to kitchen ID if needed)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get kitchen tags
      const tags = await ctx.runQuery(api.queries.kitchens.getKitchenTags, {
        kitchenId,
      });

      return {
        success: true as const,
        tags: tags || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get kitchen tags';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Chef Meals - for mobile app direct Convex communication
 */
export const customerGetChefMeals = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      meals: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'chef' role
      if (!user.roles?.includes('chef')) {
        return { success: false as const, error: 'Access denied. Chef role required.' };
      }

      // Get chef by userId
      const chef = await ctx.runQuery(api.queries.chefs.getByUserId, {
        userId: user._id,
      });

      if (!chef) {
        return { success: false as const, error: 'Chef profile not found' };
      }

      // Get meals by chefId
      const meals = await ctx.runQuery(api.queries.meals.getByChefId, {
        chefId: chef._id,
        userId: user._id,
        limit: args.limit || 100,
        offset: args.offset || 0,
      });

      return {
        success: true as const,
        meals: meals || [],
        total: meals?.length || 0,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get chef meals';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Start Live Session - for mobile app direct Convex communication
 */
export const customerStartLiveSession = action({
  args: {
    sessionToken: v.string(),
    channelName: v.string(),
    title: v.string(),
    description: v.string(),
    mealId: v.string(),
    thumbnailUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.object({
      city: v.string(),
      coordinates: v.array(v.number()),
      address: v.optional(v.string()),
      radius: v.optional(v.number()),
    })),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sessionId: v.string(),
      session: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'chef' role
      if (!user.roles?.includes('chef')) {
        return { success: false as const, error: 'Access denied. Chef role required.' };
      }

      // Get chef by userId
      const chef = await ctx.runQuery(api.queries.chefs.getByUserId, {
        userId: user._id,
      });

      if (!chef) {
        return { success: false as const, error: 'Chef profile not found' };
      }

      // Create live session
      const sessionId = await ctx.runMutation(api.mutations.liveSessions.createLiveSession, {
        channelName: args.channelName,
        chefId: chef._id,
        title: args.title,
        description: args.description,
        mealId: args.mealId as Id<'meals'>,
        thumbnailUrl: args.thumbnailUrl,
        tags: args.tags,
        location: args.location,
      });

      return {
        success: true as const,
        sessionId: sessionId.toString(),
        session: {
          sessionId: sessionId.toString(),
          channelName: args.channelName,
          title: args.title,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start live session';
      return { success: false as const, error: errorMessage };
    }
  },
});

