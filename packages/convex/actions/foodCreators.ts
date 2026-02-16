// @ts-nocheck
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

// Helper to normalize kitchen ID - converts foodCreator ID to kitchen ID if needed
async function normalizeKitchenId(ctx: any, id: string): Promise<Id<'kitchens'> | null> {
    // First, try to get the kitchen directly (this won't validate ID type)
    try {
        const kitchenId = id as Id<'kitchens'>;
        const kitchen = await ctx.db.get(kitchenId);
        if (kitchen) {
            return kitchenId;
        }
    } catch (error) {
        // If it's not a valid ID format, continue to try foodCreator ID
    }

    // If kitchen lookup failed, try as foodCreator ID and convert
    try {
        const foodCreatorId = id as Id<'chefs'>;
        const foodCreator = await ctx.db.get(foodCreatorId);
        if (!foodCreator) {
            return null;
        }

        // Find kitchen by owner_id (foodCreator userId)
        const kitchen = await ctx.db
            .query("kitchens")
            .filter((q) => q.eq(q.field("owner_id"), foodCreator.userId))
            .first();

        return kitchen?._id || null;
    } catch (error) {
        // If both fail, return null
        return null;
    }
}

/**
 * Customer Get Nearby Food Creators - for mobile app direct Convex communication
 */
export const customerGetNearbyFoodCreators = action({
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
            foodCreators: v.array(v.any()),
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

            // Get foodCreators by location
            const result = await ctx.runQuery(api.queries.foodCreators.getFoodCreatorsByLocation, {
                latitude: args.latitude,
                longitude: args.longitude,
                radiusKm,
                limit,
                page,
            });

            // Transform to match API format
            const foodCreators = result.foodCreators.map((foodCreator: any) => ({
                id: foodCreator._id,
                name: foodCreator.name,
                bio: foodCreator.bio,
                specialties: foodCreator.specialties || [],
                rating: foodCreator.rating || 0,
                location: {
                    latitude: foodCreator.location?.coordinates?.[0] || 0,
                    longitude: foodCreator.location?.coordinates?.[1] || 0,
                    address: foodCreator.location?.address || '',
                    city: foodCreator.location?.city || '',
                },
                distance: foodCreator.distance || 0,
                deliveryTime: foodCreator.deliveryTime || null,
                profileImage: foodCreator.profileImage,
                isAvailable: foodCreator.isAvailable,
                status: foodCreator.status,
            }));

            return {
                success: true as const,
                foodCreators,
                total: result.total,
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to get nearby food creators';
            return { success: false as const, error: errorMessage };
        }
    },
});

/**
 * Customer Get Food Creator Details - for mobile app direct Convex communication
 */
export const customerGetFoodCreatorDetails = action({
    args: {
        sessionToken: v.string(),
        foodCreatorId: v.string(),
    },
    returns: v.union(
        v.object({
            success: v.literal(true),
            foodCreator: v.any(),
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

            // Get foodCreator details
            const foodCreator = await ctx.runQuery(api.queries.foodCreators.getFoodCreatorById, {
                chefId: args.foodCreatorId as Id<'chefs'>,
            });

            if (!foodCreator) {
                return { success: false as const, error: 'Food Creator not found' };
            }

            // Transform to match API format
            const foodCreatorData = {
                id: foodCreator._id,
                name: foodCreator.name,
                bio: foodCreator.bio,
                specialties: foodCreator.specialties || [],
                rating: foodCreator.rating || 0,
                location: {
                    latitude: foodCreator.location?.coordinates?.[0] || 0,
                    longitude: foodCreator.location?.coordinates?.[1] || 0,
                    address: foodCreator.location?.address || '',
                    city: foodCreator.location?.city || '',
                },
                profileImage: foodCreator.profileImage,
                isAvailable: foodCreator.isAvailable,
                status: foodCreator.status,
                availableDays: foodCreator.availableDays,
                availableHours: foodCreator.availableHours,
                maxOrdersPerDay: foodCreator.maxOrdersPerDay,
                advanceBookingDays: foodCreator.advanceBookingDays,
                specialInstructions: foodCreator.specialInstructions,
                performance: foodCreator.performance,
            };

            return {
                success: true as const,
                foodCreator: foodCreatorData,
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to get food creator details';
            return { success: false as const, error: errorMessage };
        }
    },
});

/**
 * Customer Search Food Creators - for mobile app direct Convex communication
 */
export const customerSearchFoodCreators = action({
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
            foodCreators: v.array(v.any()),
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

                const result = await ctx.runQuery(api.queries.foodCreators.searchFoodCreatorsByQuery, {
                    query: args.q,
                    latitude: args.latitude,
                    longitude: args.longitude,
                    radiusKm,
                    limit,
                });

                // Transform to match API format
                const foodCreators = result.foodCreators.map((foodCreator: any) => ({
                    id: foodCreator._id,
                    name: foodCreator.name,
                    bio: foodCreator.bio,
                    specialties: foodCreator.specialties || [],
                    rating: foodCreator.rating || 0,
                    location: {
                        latitude: foodCreator.location?.coordinates?.[0] || 0,
                        longitude: foodCreator.location?.coordinates?.[1] || 0,
                        address: foodCreator.location?.address || '',
                        city: foodCreator.location?.city || '',
                    },
                    distance: foodCreator.distance || 0,
                    profileImage: foodCreator.profileImage,
                    isAvailable: foodCreator.isAvailable,
                    status: foodCreator.status,
                }));

                return {
                    success: true as const,
                    foodCreators,
                    total: result.total,
                };
            } else {
                // Simple search without location (search all foodCreators)
                const allFoodCreators = await ctx.runQuery(api.queries.foodCreators.getAll, {});
                const queryLower = args.q.toLowerCase();

                const filteredFoodCreators = allFoodCreators
                    .filter((foodCreator: any) =>
                        foodCreator.name?.toLowerCase().includes(queryLower) ||
                        foodCreator.bio?.toLowerCase().includes(queryLower) ||
                        foodCreator.specialties?.some((s: string) => s.toLowerCase().includes(queryLower)) ||
                        foodCreator.location?.city?.toLowerCase().includes(queryLower)
                    )
                    .slice(0, args.limit || 20);

                const foodCreators = filteredFoodCreators.map((foodCreator: any) => ({
                    id: foodCreator._id,
                    name: foodCreator.name,
                    bio: foodCreator.bio,
                    specialties: foodCreator.specialties || [],
                    rating: foodCreator.rating || 0,
                    location: {
                        latitude: foodCreator.location?.coordinates?.[0] || 0,
                        longitude: foodCreator.location?.coordinates?.[1] || 0,
                        address: foodCreator.location?.address || '',
                        city: foodCreator.location?.city || '',
                    },
                    profileImage: foodCreator.profileImage,
                    isAvailable: foodCreator.isAvailable,
                    status: foodCreator.status,
                }));

                return {
                    success: true as const,
                    foodCreators,
                    total: filteredFoodCreators.length,
                };
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to search food creators';
            return { success: false as const, error: errorMessage };
        }
    },
});

/**
 * Customer Get Popular Food Creators - for mobile app direct Convex communication
 */
export const customerGetPopularFoodCreators = action({
    args: {
        sessionToken: v.string(),
        limit: v.optional(v.number()),
    },
    returns: v.union(
        v.object({
            success: v.literal(true),
            foodCreators: v.array(v.any()),
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

            // Get top rated foodCreators
            const topFoodCreators = await ctx.runQuery(api.queries.foodCreators.getTopRatedFoodCreators, {
                limit: args.limit || 10,
            });

            // Transform to match API format
            const foodCreators = topFoodCreators.map((foodCreator: any) => ({
                id: foodCreator._id,
                name: foodCreator.name,
                bio: foodCreator.bio,
                specialties: foodCreator.specialties || [],
                rating: foodCreator.rating || 0,
                location: {
                    latitude: foodCreator.location?.coordinates?.[0] || 0,
                    longitude: foodCreator.location?.coordinates?.[1] || 0,
                    address: foodCreator.location?.address || '',
                    city: foodCreator.location?.city || '',
                },
                profileImage: foodCreator.profileImage,
                isAvailable: foodCreator.isAvailable,
                status: foodCreator.status,
            }));

            return {
                success: true as const,
                foodCreators,
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to get popular food creators';
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

            // For now, return top rated foodCreators as featured kitchens
            // You might want to add a "featured" flag to the chefs schema
            const topFoodCreators = await ctx.runQuery(api.queries.foodCreators.getTopRatedFoodCreators, {
                limit: args.limit || 10,
            });

            // Transform to match API format
            const kitchens = topFoodCreators.map((foodCreator: any) => ({
                id: foodCreator._id,
                name: foodCreator.name,
                bio: foodCreator.bio,
                specialties: foodCreator.specialties || [],
                rating: foodCreator.rating || 0,
                location: {
                    latitude: foodCreator.location?.coordinates?.[0] || 0,
                    longitude: foodCreator.location?.coordinates?.[1] || 0,
                    address: foodCreator.location?.address || '',
                    city: foodCreator.location?.city || '',
                },
                profileImage: foodCreator.profileImage,
                isAvailable: foodCreator.isAvailable,
                status: foodCreator.status,
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

            // Normalize kitchen ID (convert foodCreator ID to kitchen ID if needed)
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

            // Normalize kitchen ID (convert foodCreator ID to kitchen ID if needed)
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

            // Normalize kitchen ID (convert foodCreator ID to kitchen ID if needed)
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

            // Normalize kitchen ID (convert foodCreator ID to kitchen ID if needed)
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
 * Customer Get Food Creator Meals - for mobile app direct Convex communication
 */
export const customerGetFoodCreatorMeals = action({
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

            // Ensure user has 'chef' role (might want to rename role eventually but keeping for now)
            if (!user.roles?.includes('chef')) {
                return { success: false as const, error: 'Access denied. Food Creator role required.' };
            }

            // Get foodCreator by userId
            const foodCreator = await ctx.runQuery(api.queries.foodCreators.getByUserId, {
                userId: user._id,
            });

            if (!foodCreator) {
                return { success: false as const, error: 'Food Creator profile not found' };
            }

            // Get meals by chefId
            const meals = await ctx.runQuery(api.queries.meals.getByChefId, {
                chefId: foodCreator._id,
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
            const errorMessage = error?.message || 'Failed to get food creator meals';
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
                return { success: false as const, error: 'Access denied. Food Creator role required.' };
            }

            // Get foodCreator by userId
            const foodCreator = await ctx.runQuery(api.queries.foodCreators.getByUserId, {
                userId: user._id,
            });

            if (!foodCreator) {
                return { success: false as const, error: 'Food Creator profile not found' };
            }

            // Create live session
            const sessionId = await ctx.runMutation(api.mutations.liveSessions.createLiveSession, {
                channelName: args.channelName,
                chefId: foodCreator._id,
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

/**
 * Food Creator Login - for web food creator portal
 */
export const foodCreatorLogin = action({
    args: {
        email: v.string(),
        password: v.string(),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        deviceId: v.optional(v.string()),
        deviceName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Find user by email
        const user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
        if (!user) return { success: false, error: 'Invalid credentials' };

        // Check if user has chef role
        if (!user.roles?.includes('chef')) {
            return { success: false, error: 'Access denied. Food Creator account required.' };
        }

        // Check if user has a password set
        if (!user.password) {
            return { success: false, error: 'No password set. Please use social login or reset password.' };
        }

        // Check password
        const isPasswordValid = await ctx.runAction(api.actions.password.verifyPasswordAction, {
            password: args.password,
            hashedPassword: user.password,
        });

        if (!isPasswordValid) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Generate and set session token
        // Food Creator sessions valid for 30 days
        let sessionResult;
        try {
            sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
                userId: user._id,
                expiresInDays: 30,
                userAgent: args.userAgent,
                ipAddress: args.ipAddress,
                deviceId: args.deviceId,
                deviceName: args.deviceName,
            });
        } catch (err: any) {
            console.error("Error creating session token for food creator:", args.email, err);
            // Return a proper error instead of crashing
            return { success: false, error: `Session creation failed: ${err?.message || "Unknown error"}` };
        }
        return {
            success: true,
            sessionToken: sessionResult.sessionToken,
            user: {
                userId: user._id,
                email: user.email,
                name: user.name,
            }
        };
    }
});

/**
 * Customer Get Popular Food Creator Details - for mobile app direct Convex communication
 * (Migrated from users.ts customerGetPopularChefDetails)
 */
export const customerGetPopularFoodCreatorDetails = action({
    args: {
        sessionToken: v.optional(v.string()),
        foodCreatorId: v.string(),
    },
    returns: v.union(
        v.object({
            success: v.literal(true),
            foodCreator: v.any(),
            reviews: v.array(v.any()),
            averageRating: v.number(),
            reviewCount: v.number(),
        }),
        v.object({
            success: v.literal(false),
            error: v.string(),
        })
    ),
    handler: async (ctx, args) => {
        try {
            // Get foodCreator details
            const foodCreator = await ctx.runQuery(api.queries.foodCreators.getById, {
                chefId: args.foodCreatorId as Id<'chefs'>,
            });

            if (!foodCreator) {
                return { success: false as const, error: 'Food Creator not found' };
            }

            // Get reviews for this foodCreator
            const reviews = await ctx.runQuery(api.queries.reviews.getByChef, {
                chef_id: args.foodCreatorId,
            });

            // Calculate average rating
            const reviewCount = reviews.length;
            const averageRating = reviewCount > 0
                ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
                : foodCreator.rating || 0;

            // Get favorite status if user is authenticated
            let isFavorited = false;
            if (args.sessionToken) {
                const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
                    sessionToken: args.sessionToken,
                });
                if (user) {
                    const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isChefFavorited, {
                        userId: user._id,
                        chefId: args.foodCreatorId as Id<'chefs'>,
                    });
                    isFavorited = favoriteStatus.isFavorited;
                }
            }

            return {
                success: true as const,
                foodCreator: {
                    ...foodCreator,
                    isFavorited,
                },
                reviews,
                averageRating,
                reviewCount,
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to get popular food creator details';
            return { success: false as const, error: errorMessage };
        }
    },
});

/**
 * Customer Search Food Creators By Location - for mobile app direct Convex communication
 * (Migrated from users.ts customerSearchChefsByLocation)
 */
export const customerSearchFoodCreatorsByLocation = action({
    args: {
        sessionToken: v.optional(v.string()),
        query: v.optional(v.string()),
        latitude: v.number(),
        longitude: v.number(),
        radius: v.optional(v.number()),
        cuisine: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.union(
        v.object({
            success: v.literal(true),
            foodCreators: v.array(v.any()),
            total: v.number(),
        }),
        v.object({
            success: v.literal(false),
            error: v.string(),
        })
    ),
    handler: async (ctx, args) => {
        try {
            // If query is provided, use searchFoodCreatorsByQuery
            if (args.query) {
                const result = await ctx.runQuery(api.queries.foodCreators.searchFoodCreatorsByQuery, {
                    query: args.query,
                    latitude: args.latitude,
                    longitude: args.longitude,
                    radiusKm: args.radius || 10,
                    cuisine: args.cuisine,
                    limit: args.limit || 20,
                });

                return {
                    success: true as const,
                    foodCreators: result.foodCreators || [],
                    total: result.total || 0,
                };
            } else {
                // Just get foodCreators by location
                const result = await ctx.runQuery(api.queries.foodCreators.getFoodCreatorsByLocation, {
                    latitude: args.latitude,
                    longitude: args.longitude,
                    radiusKm: args.radius || 10,
                    limit: args.limit || 20,
                    page: 1,
                });

                return {
                    success: true as const,
                    foodCreators: result.foodCreators || [],
                    total: result.total || 0,
                };
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to search food creators by location';
            return { success: false as const, error: errorMessage };
        }
    },
});

/**
 * Customer Get Kitchen Favorite Status - for mobile app direct Convex communication
 * (Migrated from users.ts with same name)
 */
export const customerGetKitchenFavoriteStatus = action({
    args: {
        sessionToken: v.string(),
        kitchenId: v.string(),
    },
    returns: v.union(
        v.object({
            success: v.literal(true),
            isFavorited: v.boolean(),
            favoriteId: v.optional(v.string()),
            chefId: v.optional(v.string()),
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

            // Normalize kitchen ID (validate and convert to Convex ID)
            const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
            if (!kitchenId) {
                return { success: false as const, error: 'Kitchen not found' };
            }

            // Get kitchen favorite status
            const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isKitchenFavorited, {
                userId: user._id,
                kitchenId,
            });

            return {
                success: true as const,
                isFavorited: favoriteStatus.isFavorited,
                favoriteId: favoriteStatus.favoriteId,
                chefId: favoriteStatus.chefId,
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to get kitchen favorite status';
            return { success: false as const, error: errorMessage };
        }
    },
});

/**
 * Customer Add Kitchen Favorite - for mobile app direct Convex communication
 * (Migrated from users.ts with same name)
 */
export const customerAddKitchenFavorite = action({
    args: {
        sessionToken: v.string(),
        kitchenId: v.string(),
    },
    returns: v.union(
        v.object({
            success: v.literal(true),
            isFavorited: v.boolean(),
            favoriteId: v.string(),
            chefId: v.string(),
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

            // Ensure user has 'customer' role
            if (!user.roles?.includes('customer')) {
                return { success: false as const, error: 'Access denied. Customer role required.' };
            }

            // Normalize kitchen ID (validate and convert to Convex ID)
            const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
            if (!kitchenId) {
                return { success: false as const, error: 'Kitchen not found' };
            }

            // Get chefId from kitchenId
            const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isKitchenFavorited, {
                userId: user._id,
                kitchenId,
            });

            if (!favoriteStatus.chefId) {
                return { success: false as const, error: 'Kitchen or chef not found' };
            }

            // Add to favorites
            const favoriteId = await ctx.runMutation(api.mutations.userFavorites.addFavorite, {
                userId: user._id,
                chefId: favoriteStatus.chefId,
            });

            return {
                success: true as const,
                isFavorited: true,
                favoriteId,
                chefId: favoriteStatus.chefId,
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to add kitchen favorite';
            return { success: false as const, error: errorMessage };
        }
    },
});

/**
 * Customer Remove Kitchen Favorite - for mobile app direct Convex communication
 * (Migrated from users.ts with same name)
 */
export const customerRemoveKitchenFavorite = action({
    args: {
        sessionToken: v.string(),
        kitchenId: v.string(),
    },
    returns: v.union(
        v.object({
            success: v.literal(true),
            isFavorited: v.boolean(),
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

            // Ensure user has 'customer' role
            if (!user.roles?.includes('customer')) {
                return { success: false as const, error: 'Access denied. Customer role required.' };
            }

            // Normalize kitchen ID (validate and convert to Convex ID)
            const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
            if (!kitchenId) {
                return { success: false as const, error: 'Kitchen not found' };
            }

            // Get chefId from kitchenId
            const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isKitchenFavorited, {
                userId: user._id,
                kitchenId,
            });

            if (!favoriteStatus.chefId) {
                return { success: false as const, error: 'Kitchen or chef not found' };
            }

            // Remove from favorites
            await ctx.runMutation(api.mutations.userFavorites.removeFavorite, {
                userId: user._id,
                chefId: favoriteStatus.chefId,
            });

            return {
                success: true as const,
                isFavorited: false,
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to remove kitchen favorite';
            return { success: false as const, error: errorMessage };
        }
    },
});
