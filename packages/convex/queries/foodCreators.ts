// @ts-nocheck
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { internalQuery, query } from '../_generated/server';
import { isAdmin, isStaff, requireAuth, requireStaff } from '../utils/auth';
import { calculateDeliveryTimeFromLocations, formatDeliveryTime } from '../utils/timeCalculations';

/**
 * Helper function to check if a foodCreator has any meals
 * Returns true if foodCreator has at least one meal (regardless of status)
 */
async function foodCreatorHasMeals(ctx: any, foodCreatorId: Id<"chefs">): Promise<boolean> {
  const meals = await ctx.db
    .query('meals')
    .filter(q => q.eq(q.field('chefId'), foodCreatorId))
    .first();
  return meals !== null;
}

// FoodCreator document validator based on schema
const foodCreatorDocValidator = v.object({
  _id: v.id("chefs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  bio: v.string(),
  specialties: v.array(v.string()),
  rating: v.number(),
  status: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("suspended"),
    v.literal("pending_verification")
  ),
  location: v.object({
    city: v.string(),
    coordinates: v.array(v.number()),
  }),
  isAvailable: v.optional(v.boolean()),
  availableDays: v.optional(v.array(v.string())),
  availableHours: v.optional(v.object({})),
  maxOrdersPerDay: v.optional(v.number()),
  advanceBookingDays: v.optional(v.number()),
  specialInstructions: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  onboardingDraft: v.optional(v.object({
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    profileImage: v.optional(v.string()),
    kitchenName: v.optional(v.string()),
    kitchenAddress: v.optional(v.string()),
    kitchenType: v.optional(v.string()),
    kitchenImages: v.optional(v.array(v.string())),
    currentStep: v.optional(v.string()),
  })),
  verificationStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("verified"),
    v.literal("rejected")
  )),
  verificationDocuments: v.optional(v.object({
    healthPermit: v.boolean(),
    insurance: v.boolean(),
    backgroundCheck: v.boolean(),
    certifications: v.array(v.string())
  })),
  performance: v.optional(v.object({
    totalOrders: v.number(),
    completedOrders: v.number(),
    averageRating: v.number(),
    totalEarnings: v.number(),
    lastOrderDate: v.optional(v.number())
  })),
  complianceTrainingSkipped: v.optional(v.boolean()),
  updatedAt: v.optional(v.number()),
});

// Cuisine document validator based on schema
const cuisineDocValidator = v.object({
  _id: v.id("cuisines"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.string(),
  status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
  createdBy: v.id('users'),
  createdAt: v.number(),
  updatedAt: v.number(),
  image: v.optional(v.string()),
});

// Meal document validator based on schema
const mealDocValidator = v.object({
  _id: v.id("meals"),
  _creationTime: v.number(),
  chefId: v.id("chefs"),
  name: v.string(),
  description: v.string(),
  price: v.number(),
  cuisine: v.array(v.string()),
  dietary: v.array(v.string()),
  status: v.union(v.literal("available"), v.literal("unavailable")),
  rating: v.optional(v.number()),
  images: v.array(v.string()),
});

export const getAllFoodCreatorLocations = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(v.object({
    chefId: v.id('chefs'),
    userId: v.id('users'),
    city: v.string(),
    coordinates: v.array(v.number()),
    bio: v.string(),
    specialties: v.array(v.string()),
    rating: v.number(),
    status: v.string()
  })),
  handler: async (ctx, args) => {
    const { limit, offset = 0 } = args;

    // Fetch all foodCreators (will be optimized with index in schema if needed)
    const allFoodCreators = await ctx.db.query('chefs').collect();

    // Filter out foodCreators with no meals
    const foodCreatorsWithMeals = await Promise.all(
      allFoodCreators.map(async (foodCreator) => {
        const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
        return hasMeals ? foodCreator : null;
      })
    );
    const filteredFoodCreators = foodCreatorsWithMeals.filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null);

    // Map to location format
    const mapped = filteredFoodCreators.map(foodCreator => ({
      foodCreatorId: foodCreator._id,
      userId: foodCreator.userId,
      city: foodCreator.location.city,
      coordinates: foodCreator.location.coordinates,
      bio: foodCreator.bio,
      specialties: foodCreator.specialties,
      rating: foodCreator.rating,
      status: foodCreator.status
    }));

    // Apply pagination
    if (limit !== undefined) {
      return mapped.slice(offset, offset + limit);
    }

    // If no limit, return all from offset
    return mapped.slice(offset);
  }
});

// Get all foodCreators
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(foodCreatorDocValidator),
  handler: async (ctx, args) => {
    const { limit, offset = 0 } = args;

    // Fetch all foodCreators (will be optimized with index in schema if needed)
    const allFoodCreators = await ctx.db.query('chefs').collect();

    // Filter out foodCreators with no meals
    const foodCreatorsWithMeals = await Promise.all(
      allFoodCreators.map(async (foodCreator) => {
        const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
        return hasMeals ? foodCreator : null;
      })
    );
    const filteredFoodCreators = foodCreatorsWithMeals.filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null);

    // Apply pagination
    if (limit !== undefined) {
      return filteredFoodCreators.slice(offset, offset + limit);
    }

    // If no limit, return all from offset
    return filteredFoodCreators.slice(offset);
  }
});

export const getFoodCreatorById = query({
  args: { foodCreatorId: v.id('chefs') },
  returns: v.union(foodCreatorDocValidator, v.null()),
  handler: async (ctx, args) => {
    const foodCreator = await ctx.db.get(args.foodCreatorId);
    if (!foodCreator) {
      return null;
    }

    // Filter out foodCreators with no meals
    const hasMeals = await foodCreatorHasMeals(ctx, args.foodCreatorId);
    if (!hasMeals) {
      return null;
    }

    return foodCreator;
  }
});

// Alias for consistency with other queries
export const getById = getFoodCreatorById;

// Get kitchen phone by foodCreator ID (gets phone from associated user)
export const getKitchenPhoneByFoodCreatorId = query({
  args: {
    foodCreatorId: v.id('chefs'),
  },
  handler: async (ctx, args) => {
    const foodCreator = await ctx.db.get(args.foodCreatorId);
    if (!foodCreator) {
      return null;
    }

    // Get user to access phone_number
    const user = await ctx.db.get(foodCreator.userId);
    if (!user) {
      return null;
    }

    return user.phone_number || null;
  },
});

export const getPendingCuisines = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.array(cuisineDocValidator),
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);

    // Assume there is a cuisines table with a status field
    const pending = await ctx.db.query('cuisines').filter(q => q.eq(q.field('status'), 'pending')).collect();
    return pending;
  }
});

export const getCuisineById = query({
  args: { cuisineId: v.id('cuisines') },
  returns: v.union(cuisineDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cuisineId);
  }
});

export const listAllCuisines = query({
  args: {},
  returns: v.array(cuisineDocValidator),
  handler: async (ctx) => {
    return await ctx.db.query('cuisines').collect();
  }
});

export const listCuisinesByStatus = query({
  args: {
    status: v.string(),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(cuisineDocValidator),
  handler: async (ctx, args) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);

    return await ctx.db.query('cuisines').filter(q => q.eq(q.field('status'), args.status)).collect();
  }
});

export const getMenuById = query({
  args: { menuId: v.id('meals') },
  returns: v.union(mealDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.menuId);
  }
});

export const getMenusByFoodCreatorId = query({
  args: { foodCreatorId: v.id('chefs') },
  returns: v.array(mealDocValidator),
  handler: async (ctx, args) => {
    return await ctx.db.query('meals').filter(q => q.eq(q.field('chefId'), args.foodCreatorId)).collect();
  }
});

export const getByUserId = query({
  args: {
    userId: v.string(),
    sessionToken: v.optional(v.string())
  },
  returns: v.union(foodCreatorDocValidator, v.null()),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can access their own foodCreator profile, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id.toString()) {
      throw new Error('Access denied');
    }

    const foodCreator = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();
    return foodCreator;
  }
});

/**
 * Check if foodCreator has completed basic onboarding (profile setup)
 * Basic onboarding is complete when foodCreator profile has:
 * - name (non-empty)
 * - bio (non-empty)
 * - specialties (at least one)
 * - location with city and coordinates
 */
export const isBasicOnboardingComplete = query({
  args: {
    foodCreatorId: v.id("chefs"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get foodCreator to verify ownership
    const foodCreator = await ctx.db.get(args.foodCreatorId);

    if (!foodCreator) {
      return false;
    }

    // Users can only check their own onboarding, staff/admin can check any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      return false;
    }

    // Check if all required basic profile fields are filled
    const hasName = foodCreator.name && foodCreator.name.trim().length > 0;
    const hasBio = foodCreator.bio && foodCreator.bio.trim().length > 0;
    const hasSpecialties = foodCreator.specialties && foodCreator.specialties.length > 0;
    const hasLocation = foodCreator.location &&
      foodCreator.location.city &&
      foodCreator.location.city.trim().length > 0 &&
      foodCreator.location.coordinates &&
      Array.isArray(foodCreator.location.coordinates) &&
      foodCreator.location.coordinates.length === 2;

    return hasName && hasBio && hasSpecialties && hasLocation;
  },
});

// FoodCreator with distance (for location queries)
// Extends foodCreatorDocValidator to include distance field
const foodCreatorWithDistanceValidator = v.object({
  _id: v.id("chefs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  bio: v.string(),
  specialties: v.array(v.string()),
  rating: v.number(),
  status: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("suspended"),
    v.literal("pending_verification")
  ),
  location: v.object({
    city: v.string(),
    coordinates: v.array(v.number()),
  }),
  isAvailable: v.optional(v.boolean()),
  availableDays: v.optional(v.array(v.string())),
  availableHours: v.optional(v.object({})),
  maxOrdersPerDay: v.optional(v.number()),
  advanceBookingDays: v.optional(v.number()),
  specialInstructions: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  onboardingDraft: v.optional(v.object({
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    profileImage: v.optional(v.string()),
    kitchenName: v.optional(v.string()),
    kitchenAddress: v.optional(v.string()),
    kitchenType: v.optional(v.string()),
    kitchenImages: v.optional(v.array(v.string())),
    currentStep: v.optional(v.string()),
  })),
  verificationStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("verified"),
    v.literal("rejected")
  )),
  verificationDocuments: v.optional(v.object({
    healthPermit: v.boolean(),
    insurance: v.boolean(),
    backgroundCheck: v.boolean(),
    certifications: v.array(v.string())
  })),
  performance: v.optional(v.object({
    totalOrders: v.number(),
    completedOrders: v.number(),
    averageRating: v.number(),
    totalEarnings: v.number(),
    lastOrderDate: v.optional(v.number())
  })),
  complianceTrainingSkipped: v.optional(v.boolean()),
  updatedAt: v.optional(v.number()),
  distance: v.number(),
  deliveryTime: v.optional(v.string()),
});

export const findNearbyFoodCreators = query({
  args: { latitude: v.number(), longitude: v.number(), maxDistanceKm: v.optional(v.number()) },
  returns: v.array(foodCreatorWithDistanceValidator),
  handler: async (ctx, args) => {
    const { latitude, longitude, maxDistanceKm = 10 } = args;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const earthRadiusKm = 6371;

    // Filter by status first to reduce dataset size
    const foodCreators = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();

    // Filter out foodCreators with no meals
    const foodCreatorsWithMeals = await Promise.all(
      foodCreators.map(async (foodCreator) => {
        const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
        return hasMeals ? foodCreator : null;
      })
    );
    const filteredFoodCreators = foodCreatorsWithMeals.filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null);

    const withDistance = filteredFoodCreators
      .filter(foodCreator => {
        // Filter out foodCreators without location data
        return foodCreator.location &&
          foodCreator.location.coordinates &&
          Array.isArray(foodCreator.location.coordinates) &&
          foodCreator.location.coordinates.length === 2 &&
          typeof foodCreator.location.coordinates[0] === 'number' &&
          typeof foodCreator.location.coordinates[1] === 'number';
      })
      .map(foodCreator => {
        // Coordinates are stored as [latitude, longitude]
        const [foodCreatorLat, foodCreatorLng] = foodCreator.location.coordinates;
        const dLat = toRad(foodCreatorLat - latitude);
        const dLng = toRad(foodCreatorLng - longitude);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(foodCreatorLat)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadiusKm * c;

        // Calculate delivery time based on distance
        const deliveryTimeMinutes = calculateDeliveryTimeFromLocations(
          foodCreatorLat,
          foodCreatorLng,
          latitude,
          longitude
        );
        const deliveryTime = formatDeliveryTime(deliveryTimeMinutes);

        return { ...foodCreator, distance, deliveryTime };
      });

    // Filter by distance and sort: online foodCreators first, then by distance
    return withDistance
      .filter(c => c.distance <= maxDistanceKm)
      .sort((a, b) => {
        // Prioritize online foodCreators (isAvailable === true)
        const aOnline = a.isAvailable === true ? 1 : 0;
        const bOnline = b.isAvailable === true ? 1 : 0;
        if (aOnline !== bOnline) {
          return bOnline - aOnline; // Online foodCreators first
        }
        // If both have same online status, sort by distance
        return a.distance - b.distance;
      });
  }
});

// Get foodCreators by location with pagination for API endpoints
export const getFoodCreatorsByLocation = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.number(),
    limit: v.number(),
    page: v.number()
  },
  returns: v.object({
    foodCreators: v.array(foodCreatorWithDistanceValidator),
    total: v.number()
  }),
  handler: async (ctx, args) => {
    const { latitude, longitude, radiusKm, limit, page } = args;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const earthRadiusKm = 6371;

    // Filter by status first to reduce dataset size
    const allFoodCreators = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();

    // Filter out foodCreators with no meals
    const foodCreatorsWithMeals = await Promise.all(
      allFoodCreators.map(async (foodCreator) => {
        const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
        return hasMeals ? foodCreator : null;
      })
    );
    const filteredFoodCreators = foodCreatorsWithMeals.filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null);

    // Calculate distances and filter by radius
    const foodCreatorsWithDistance = filteredFoodCreators.map(foodCreator => {
      const foodCreatorLat = foodCreator.location?.coordinates?.[0];
      const foodCreatorLng = foodCreator.location?.coordinates?.[1];

      if (!foodCreatorLat || !foodCreatorLng) return null;

      const dLat = toRad(foodCreatorLat - latitude);
      const dLng = toRad(foodCreatorLng - longitude);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(foodCreatorLat)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadiusKm * c;

      // Calculate delivery time based on distance
      const deliveryTimeMinutes = calculateDeliveryTimeFromLocations(
        foodCreatorLat,
        foodCreatorLng,
        latitude,
        longitude
      );
      const deliveryTime = formatDeliveryTime(deliveryTimeMinutes);

      return { ...foodCreator, distance, deliveryTime };
    }).filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null && foodCreator.distance <= radiusKm);

    // Sort: online foodCreators first, then by distance
    foodCreatorsWithDistance.sort((a, b) => {
      // Prioritize online foodCreators (isAvailable === true)
      const aOnline = a.isAvailable === true ? 1 : 0;
      const bOnline = b.isAvailable === true ? 1 : 0;
      if (aOnline !== bOnline) {
        return bOnline - aOnline; // Online foodCreators first
      }
      // If both have same online status, sort by distance
      return a.distance - b.distance;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFoodCreators = foodCreatorsWithDistance.slice(startIndex, endIndex);

    return {
      foodCreators: paginatedFoodCreators,
      total: foodCreatorsWithDistance.length
    };
  }
});

// Search foodCreators by query string
export const searchFoodCreatorsByQuery = query({
  args: {
    query: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.number(),
    cuisine: v.optional(v.string()),
    limit: v.number()
  },
  returns: v.object({
    foodCreators: v.array(foodCreatorWithDistanceValidator),
    total: v.number()
  }),
  handler: async (ctx, args) => {
    const { query: searchQuery, latitude, longitude, radiusKm, cuisine, limit } = args;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const earthRadiusKm = 6371;

    // Filter by status first to reduce dataset size
    let foodCreators = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();

    // Filter out foodCreators with no meals
    const foodCreatorsWithMeals = await Promise.all(
      foodCreators.map(async (foodCreator) => {
        const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
        return hasMeals ? foodCreator : null;
      })
    );
    foodCreators = foodCreatorsWithMeals.filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null);

    // Filter by cuisine if specified
    if (cuisine) {
      foodCreators = foodCreators.filter(foodCreator =>
        foodCreator.specialties?.some(specialty =>
          specialty.toLowerCase().includes(cuisine.toLowerCase())
        )
      );
    }

    // Filter by search query
    const queryLower = searchQuery.toLowerCase();
    foodCreators = foodCreators.filter(foodCreator =>
      foodCreator.name?.toLowerCase().includes(queryLower) ||
      foodCreator.specialties?.some(specialty =>
        specialty.toLowerCase().includes(queryLower)
      ) ||
      foodCreator.bio?.toLowerCase().includes(queryLower) ||
      foodCreator.location?.city?.toLowerCase().includes(queryLower)
    );

    // Calculate distances and filter by radius
    const foodCreatorsWithDistance = foodCreators.map(foodCreator => {
      const foodCreatorLat = foodCreator.location?.coordinates?.[0];
      const foodCreatorLng = foodCreator.location?.coordinates?.[1];

      if (!foodCreatorLat || !foodCreatorLng) return null;

      const dLat = toRad(foodCreatorLat - latitude);
      const dLng = toRad(foodCreatorLng - longitude);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(foodCreatorLat)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadiusKm * c;

      // Calculate delivery time based on distance
      const deliveryTimeMinutes = calculateDeliveryTimeFromLocations(
        foodCreatorLat,
        foodCreatorLng,
        latitude,
        longitude
      );
      const deliveryTime = formatDeliveryTime(deliveryTimeMinutes);

      return { ...foodCreator, distance, deliveryTime };
    }).filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null && foodCreator.distance <= radiusKm);

    // Sort: online foodCreators first, then by distance
    foodCreatorsWithDistance.sort((a, b) => {
      // Prioritize online foodCreators (isAvailable === true)
      const aOnline = a.isAvailable === true ? 1 : 0;
      const bOnline = b.isAvailable === true ? 1 : 0;
      if (aOnline !== bOnline) {
        return bOnline - aOnline; // Online foodCreators first
      }
      // If both have same online status, sort by distance
      return a.distance - b.distance;
    });

    // Apply limit
    const limitedFoodCreators = foodCreatorsWithDistance.slice(0, limit);

    return {
      foodCreators: limitedFoodCreators,
      total: foodCreatorsWithDistance.length
    };
  }
});

// Get favorite foodCreators for a user (simplified - returns top-rated foodCreators)
// FoodCreator with favorite info
const foodCreatorWithFavoriteValidator = v.object({
  _id: v.id("chefs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  bio: v.string(),
  specialties: v.array(v.string()),
  rating: v.number(),
  status: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("suspended"),
    v.literal("pending_verification")
  ),
  location: v.object({
    city: v.string(),
    coordinates: v.array(v.number()),
  }),
  isAvailable: v.optional(v.boolean()),
  availableDays: v.optional(v.array(v.string())),
  availableHours: v.optional(v.object({})),
  maxOrdersPerDay: v.optional(v.number()),
  advanceBookingDays: v.optional(v.number()),
  specialInstructions: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  verificationStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("verified"),
    v.literal("rejected")
  )),
  verificationDocuments: v.optional(v.object({
    healthPermit: v.boolean(),
    insurance: v.boolean(),
    backgroundCheck: v.boolean(),
    certifications: v.array(v.string())
  })),
  performance: v.optional(v.object({
    totalOrders: v.number(),
    completedOrders: v.number(),
    averageRating: v.number(),
    totalEarnings: v.number(),
    lastOrderDate: v.optional(v.number())
  })),
  complianceTrainingSkipped: v.optional(v.boolean()),
  updatedAt: v.optional(v.number()),
  isFavorited: v.boolean(),
  favoriteId: v.id("userFavorites"),
  favoritedAt: v.number(),
});

export const getFavoriteFoodCreators = query({
  args: {
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(foodCreatorWithFavoriteValidator),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can access their own favorites, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }

    try {
      const favorites = await ctx.db
        .query("userFavorites")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.eq(q.field("favoriteType"), "foodCreator")
          )
        )
        .collect();

      // Get the actual foodCreator data for each favorite
      const favoriteFoodCreatorsResults = await Promise.all(
        favorites.map(async (favorite) => {
          try {
            const foodCreatorId = favorite.favoriteId as Id<"chefs">;
            const foodCreator = await ctx.db.get(foodCreatorId);
            if (foodCreator && foodCreator.status === 'active') {
              // Check if foodCreator has meals
              const hasMeals = await foodCreatorHasMeals(ctx, foodCreatorId);
              if (!hasMeals) {
                return null;
              }
              return {
                ...foodCreator,
                isFavorited: true,
                favoriteId: favorite._id,
                favoritedAt: favorite.createdAt
              } as const;
            }
            return null;
          } catch (error) {
            console.error('Failed to get foodCreator data:', error);
            return null;
          }
        })
      );

      // Filter out null values - TypeScript type guard ensures proper typing
      const favoriteFoodCreators: Array<{
        isFavorited: true;
        favoriteId: Id<"userFavorites">;
        favoritedAt: number;
        _id: Id<"chefs">;
        _creationTime: number;
        userId: Id<"users">;
        name: string;
        bio: string;
        specialties: string[];
        rating: number;
        status: "active" | "inactive" | "suspended" | "pending_verification";
        location: { city: string; coordinates: number[] };
        isAvailable?: boolean;
        availableDays?: string[];
        availableHours?: Record<string, unknown>;

        maxOrdersPerDay?: number;
        advanceBookingDays?: number;
        specialInstructions?: string;
        profileImage?: string;
        verificationStatus?: "pending" | "verified" | "rejected";
        verificationDocuments?: {
          healthPermit: boolean;
          insurance: boolean;
          backgroundCheck: boolean;
          certifications: string[];
        };
        performance?: {
          totalOrders: number;
          completedOrders: number;
          averageRating: number;
          totalEarnings: number;
          lastOrderDate?: number;
        };
        updatedAt?: number;
      }> = favoriteFoodCreatorsResults.filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null);

      // Sort: online foodCreators first, then by favoritedAt (most recently favorited first)
      favoriteFoodCreators.sort((a, b) => {
        // Prioritize online foodCreators (isAvailable === true)
        const aOnline = a.isAvailable === true ? 1 : 0;
        const bOnline = b.isAvailable === true ? 1 : 0;
        if (aOnline !== bOnline) {
          return bOnline - aOnline; // Online foodCreators first
        }
        // If both have same online status, sort by most recently favorited
        return b.favoritedAt - a.favoritedAt;
      });

      return favoriteFoodCreators;
    } catch (error) {
      console.error('Error fetching favorite foodCreators:', error);
      return [];
    }
  }
});

// Get top-rated foodCreators (for try-it features)
export const getTopRatedFoodCreators = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(foodCreatorDocValidator),
  handler: async (ctx, args) => {
    try {
      const foodCreators = await ctx.db.query('chefs').collect();

      // Filter out foodCreators with no meals
      const foodCreatorsWithMeals = await Promise.all(
        foodCreators.map(async (foodCreator) => {
          const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
          return hasMeals ? foodCreator : null;
        })
      );
      const filteredFoodCreators = foodCreatorsWithMeals.filter((foodCreator): foodCreator is NonNullable<typeof foodCreator> => foodCreator !== null);

      // Sort: online foodCreators first, then by rating, and limit results
      const topFoodCreators = filteredFoodCreators
        .filter(foodCreator => foodCreator.status === 'active')
        .sort((a, b) => {
          // Prioritize online foodCreators (isAvailable === true)
          const aOnline = a.isAvailable === true ? 1 : 0;
          const bOnline = b.isAvailable === true ? 1 : 0;
          if (aOnline !== bOnline) {
            return bOnline - aOnline; // Online foodCreators first
          }
          // If both have same online status, sort by rating
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, args.limit || 10);

      return topFoodCreators;
    } catch (error) {
      console.error('Error fetching top-rated foodCreators:', error);
      return [];
    }
  }
});

// Get foodCreator availability
// FoodCreator availability response validator
const foodCreatorAvailabilityValidator = v.object({
  isAvailable: v.boolean(),
  availableDays: v.array(v.string()),
  availableHours: v.object({}),
  maxOrdersPerDay: v.number(),
  advanceBookingDays: v.number(),
  specialInstructions: v.string(),
});

export const getAvailability = query({
  args: { chefId: v.id('chefs') },
  returns: v.union(foodCreatorAvailabilityValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const foodCreator = await ctx.db.get(args.chefId);
      if (!foodCreator) return null;

      // Return availability information from foodCreator profile
      return {
        isAvailable: foodCreator.isAvailable || false,
        availableDays: foodCreator.availableDays || [],
        availableHours: foodCreator.availableHours || {},
        maxOrdersPerDay: foodCreator.maxOrdersPerDay || 10,
        advanceBookingDays: foodCreator.advanceBookingDays || 7,
        specialInstructions: foodCreator.specialInstructions || ''
      };
    } catch (error) {
      console.error('Error fetching foodCreator availability:', error);
      return null;
    }
  }
});

// Get all foodCreator content (recipes, live sessions, videos, meals)
export const getAllFoodCreatorContent = query({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
    contentType: v.optional(v.union(
      v.literal('all'),
      v.literal('recipes'),
      v.literal('live'),
      v.literal('videos'),
      v.literal('meals')
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const foodCreator = await ctx.db.get(args.chefId);
    if (!foodCreator) {
      return {
        recipes: [],
        liveSessions: [],
        videos: [],
        meals: [],
        stats: {
          recipes: 0,
          liveSessions: 0,
          videos: 0,
          meals: 0,
        },
      };
    }

    const limit = args.limit || 50;

    // Get recipes by author (foodCreator name)
    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_author', q => q.eq('author', foodCreator.name))
      .filter(q => q.eq(q.field('status'), 'published'))
      .order('desc')
      .take(limit);

    // Get live sessions by foodCreator
    const liveSessions = await ctx.db
      .query('liveSessions')
      .withIndex('by_chef', q => q.eq('chef_id', args.chefId))
      .order('desc')
      .take(limit);

    // Get videos by creator (user ID)
    const videos = await ctx.db
      .query('videoPosts')
      .withIndex('by_creator', q => q.eq('creatorId', foodCreator.userId))
      .filter(q => q.eq(q.field('status'), 'published'))
      .order('desc')
      .take(limit);

    // Get meals by foodCreator
    const meals = await ctx.db
      .query('meals')
      .filter(q => q.eq(q.field('chefId'), args.chefId))
      .filter(q => q.or(
        q.eq(q.field('status'), 'available'),
        q.eq(q.field('status'), 'active')
      ))
      .order('desc')
      .take(limit);

    return {
      recipes: recipes.map(r => ({
        id: r._id,
        type: 'recipe' as const,
        title: r.title,
        thumbnail: r.featuredImage,
        createdAt: r.createdAt || r._creationTime,
      })),
      liveSessions: liveSessions.map(s => ({
        id: s._id,
        type: 'live' as const,
        title: s.title,
        thumbnail: s.thumbnailUrl,
        createdAt: s._creationTime,
        status: s.status,
      })),
      videos: await Promise.all(videos.map(async (v) => {
        const thumbnailUrl = v.thumbnailStorageId
          ? await ctx.storage.getUrl(v.thumbnailStorageId) || undefined
          : undefined;
        return {
          id: v._id,
          type: 'video' as const,
          title: v.title,
          thumbnail: thumbnailUrl,
          duration: v.duration,
          views: v.viewsCount,
          createdAt: v.createdAt || v._creationTime,
        };
      })),
      meals: meals.map(m => ({
        id: m._id,
        type: 'meal' as const,
        title: m.name,
        thumbnail: m.images?.[0],
        createdAt: m._creationTime,
      })),
      stats: {
        recipes: recipes.length,
        liveSessions: liveSessions.length,
        videos: videos.length,
        meals: meals.length,
      },
    };
  },
});

/**
 * Internal query to get foodCreator by user ID without authentication
 * Used by actions during seeding and setup flows
 */
export const getFoodCreatorByUserIdInternal = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();
  },
});

/**
 * Internal query to get foodCreator by ID without authentication
 * Used by actions during seeding and setup flows
 */
export const getFoodCreatorByIdInternal = internalQuery({
  args: {
    chefId: v.id('chefs'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chefId);
  },
});

// Get food creators by city for SEO pages (returns active creators with meals in a specific city)
export const getFoodCreatorsByCity = query({
  args: {
    city: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.any()), // Relaxed validation to include username
  handler: async (ctx, args) => {
    const { city, limit = 10 } = args;

    // Normalize city name for comparison (simple check)
    const normalizedCity = city.toLowerCase();

    // 1. Get all active foodCreators
    const allActiveFoodCreators = await ctx.db
      .query('chefs')
      .withIndex('by_status', q => q.eq('status', 'active'))
      .collect();

    // 2. Filter by city
    const foodCreatorsInCity = allActiveFoodCreators.filter(foodCreator =>
      foodCreator.location?.city?.toLowerCase() === normalizedCity
    );

    // 3. Filter out foodCreators with no meals AND fetch usernames
    const foodCreatorsWithUsernames = await Promise.all(
      foodCreatorsInCity.map(async (foodCreator) => {
        const hasMeals = await foodCreatorHasMeals(ctx, foodCreator._id);
        if (!hasMeals) return null;

        const user = await ctx.db.get(foodCreator.userId);
        if (!user || !user.username) return null; // Only include foodCreators with usernames

        return {
          ...foodCreator,
          username: user.username
        };
      })
    );

    const validFoodCreators = foodCreatorsWithUsernames.filter((foodCreator) => foodCreator !== null);

    // 4. Sort by rating (highest first)
    // @ts-ignore
    validFoodCreators.sort((a, b) => b.rating - a.rating);

    return validFoodCreators.slice(0, limit);
  }
});

// Get food creator by username (for public profile SEO URLs)
export const getFoodCreatorByUsername = query({
  args: { username: v.string() },
  returns: v.union(foodCreatorDocValidator, v.null()),
  handler: async (ctx, args) => {
    // 1. Find user by username
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', q => q.eq('username', args.username))
      .first();

    if (!user) {
      return null;
    }

    // 2. Find foodCreator profile for this user
    const foodCreator = await ctx.db
      .query('chefs')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .first();

    if (!foodCreator || foodCreator.status !== 'active') {
      return null;
    }

    // 3. Verify they have meals (optional, but good for SEO pages to not show empty profiles)
    // We'll allow it for now so the profile exists, but the page can handle empty states.

    return foodCreator;
  }
});

// Get data for sitemap (food creators with usernames)
export const getFoodCreatorSitemapData = query({
  args: {},
  returns: v.array(v.object({
    username: v.string(),
    updatedAt: v.optional(v.number()),
    _creationTime: v.number(),
  })),
  handler: async (ctx) => {
    const foodCreators = await ctx.db
      .query('chefs')
      .withIndex('by_status', q => q.eq('status', 'active'))
      .collect();

    const results = await Promise.all(
      foodCreators.map(async (foodCreator) => {
        const user = await ctx.db.get(foodCreator.userId);
        if (!user || !user.username) return null;

        return {
          username: user.username,
          updatedAt: foodCreator.updatedAt,
          _creationTime: foodCreator._creationTime
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  }
}); 