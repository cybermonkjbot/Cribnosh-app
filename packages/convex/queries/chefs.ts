import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { internalQuery, query } from '../_generated/server';
import { isAdmin, isStaff, requireAuth, requireStaff } from '../utils/auth';
import { calculateDeliveryTimeFromLocations, formatDeliveryTime } from '../utils/timeCalculations';

/**
 * Helper function to check if a chef has any meals
 * Returns true if chef has at least one meal (regardless of status)
 */
async function chefHasMeals(ctx: any, chefId: Id<"chefs">): Promise<boolean> {
  const meals = await ctx.db
    .query('meals')
    .filter(q => q.eq(q.field('chefId'), chefId))
    .first();
  return meals !== null;
}

// Chef document validator based on schema
const chefDocValidator = v.object({
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

export const getAllChefLocations = query({
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
    
    // Fetch all chefs (will be optimized with index in schema if needed)
    const allChefs = await ctx.db.query('chefs').collect();
    
    // Filter out chefs with no meals
    const chefsWithMeals = await Promise.all(
      allChefs.map(async (chef) => {
        const hasMeals = await chefHasMeals(ctx, chef._id);
        return hasMeals ? chef : null;
      })
    );
    const filteredChefs = chefsWithMeals.filter((chef): chef is NonNullable<typeof chef> => chef !== null);
    
    // Map to location format
    const mapped = filteredChefs.map(chef => ({
      chefId: chef._id,
      userId: chef.userId,
      city: chef.location.city,
      coordinates: chef.location.coordinates,
      bio: chef.bio,
      specialties: chef.specialties,
      rating: chef.rating,
      status: chef.status
    }));
    
    // Apply pagination
    if (limit !== undefined) {
      return mapped.slice(offset, offset + limit);
    }
    
    // If no limit, return all from offset
    return mapped.slice(offset);
  }
});

// Get all chefs
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(chefDocValidator),
  handler: async (ctx, args) => {
    const { limit, offset = 0 } = args;
    
    // Fetch all chefs (will be optimized with index in schema if needed)
    const allChefs = await ctx.db.query('chefs').collect();
    
    // Filter out chefs with no meals
    const chefsWithMeals = await Promise.all(
      allChefs.map(async (chef) => {
        const hasMeals = await chefHasMeals(ctx, chef._id);
        return hasMeals ? chef : null;
      })
    );
    const filteredChefs = chefsWithMeals.filter((chef): chef is NonNullable<typeof chef> => chef !== null);
    
    // Apply pagination
    if (limit !== undefined) {
      return filteredChefs.slice(offset, offset + limit);
    }
    
    // If no limit, return all from offset
    return filteredChefs.slice(offset);
  }
});

export const getChefById = query({
  args: { chefId: v.id('chefs') },
  returns: v.union(chefDocValidator, v.null()),
  handler: async (ctx, args) => {
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      return null;
    }
    
    // Filter out chefs with no meals
    const hasMeals = await chefHasMeals(ctx, args.chefId);
    if (!hasMeals) {
      return null;
    }
    
    return chef;
  }
});

// Alias for consistency with other queries
export const getById = getChefById;

// Get kitchen phone by chef ID (gets phone from associated user)
export const getKitchenPhoneByChefId = query({
  args: {
    chefId: v.id('chefs'),
  },
  handler: async (ctx, args) => {
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      return null;
    }
    
    // Get user to access phone_number
    const user = await ctx.db.get(chef.userId);
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

export const getMenusByChefId = query({
  args: { chefId: v.id('chefs') },
  returns: v.array(mealDocValidator),
  handler: async (ctx, args) => {
    return await ctx.db.query('meals').filter(q => q.eq(q.field('chefId'), args.chefId)).collect();
  }
});

export const getByUserId = query({
  args: { 
    userId: v.string(),
    sessionToken: v.optional(v.string())
  },
  returns: v.union(chefDocValidator, v.null()),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own chef profile, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id.toString()) {
      throw new Error('Access denied');
    }
    
    const chef = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();
    return chef;
  }
});

/**
 * Check if chef has completed basic onboarding (profile setup)
 * Basic onboarding is complete when chef profile has:
 * - name (non-empty)
 * - bio (non-empty)
 * - specialties (at least one)
 * - location with city and coordinates
 */
export const isBasicOnboardingComplete = query({
  args: {
    chefId: v.id("chefs"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      return false;
    }
    
    // Users can only check their own onboarding, staff/admin can check any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      return false;
    }
    
    // Check if all required basic profile fields are filled
    const hasName = chef.name && chef.name.trim().length > 0;
    const hasBio = chef.bio && chef.bio.trim().length > 0;
    const hasSpecialties = chef.specialties && chef.specialties.length > 0;
    const hasLocation = chef.location && 
                       chef.location.city && 
                       chef.location.city.trim().length > 0 &&
                       chef.location.coordinates &&
                       Array.isArray(chef.location.coordinates) &&
                       chef.location.coordinates.length === 2;
    
    return hasName && hasBio && hasSpecialties && hasLocation;
  },
});

// Chef with distance (for location queries)
// Extends chefDocValidator to include distance field
const chefWithDistanceValidator = v.object({
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

export const findNearbyChefs = query({
  args: { latitude: v.number(), longitude: v.number(), maxDistanceKm: v.optional(v.number()) },
  returns: v.array(chefWithDistanceValidator),
  handler: async (ctx, args) => {
    const { latitude, longitude, maxDistanceKm = 10 } = args;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const earthRadiusKm = 6371;
    
    // Filter by status first to reduce dataset size
    const chefs = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    // Filter out chefs with no meals
    const chefsWithMeals = await Promise.all(
      chefs.map(async (chef) => {
        const hasMeals = await chefHasMeals(ctx, chef._id);
        return hasMeals ? chef : null;
      })
    );
    const filteredChefs = chefsWithMeals.filter((chef): chef is NonNullable<typeof chef> => chef !== null);
    
    const withDistance = filteredChefs
      .filter(chef => {
        // Filter out chefs without location data
        return chef.location && 
               chef.location.coordinates && 
               Array.isArray(chef.location.coordinates) && 
               chef.location.coordinates.length === 2 &&
               typeof chef.location.coordinates[0] === 'number' &&
               typeof chef.location.coordinates[1] === 'number';
      })
      .map(chef => {
        // Coordinates are stored as [latitude, longitude]
        const [chefLat, chefLng] = chef.location.coordinates;
        const dLat = toRad(chefLat - latitude);
        const dLng = toRad(chefLng - longitude);
        const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(chefLat)) * Math.sin(dLng/2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = earthRadiusKm * c;
        
        // Calculate delivery time based on distance
        const deliveryTimeMinutes = calculateDeliveryTimeFromLocations(
          chefLat,
          chefLng,
          latitude,
          longitude
        );
        const deliveryTime = formatDeliveryTime(deliveryTimeMinutes);
        
        return { ...chef, distance, deliveryTime };
      });
    
    // Filter by distance and sort: online chefs first, then by distance
    return withDistance
      .filter(c => c.distance <= maxDistanceKm)
      .sort((a, b) => {
        // Prioritize online chefs (isAvailable === true)
        const aOnline = a.isAvailable === true ? 1 : 0;
        const bOnline = b.isAvailable === true ? 1 : 0;
        if (aOnline !== bOnline) {
          return bOnline - aOnline; // Online chefs first
        }
        // If both have same online status, sort by distance
        return a.distance - b.distance;
      });
  }
});

// Get chefs by location with pagination for API endpoints
export const getChefsByLocation = query({
  args: { 
    latitude: v.number(), 
    longitude: v.number(), 
    radiusKm: v.number(),
    limit: v.number(),
    page: v.number()
  },
  returns: v.object({
    chefs: v.array(chefWithDistanceValidator),
    total: v.number()
  }),
  handler: async (ctx, args) => {
    const { latitude, longitude, radiusKm, limit, page } = args;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const earthRadiusKm = 6371;
    
    // Filter by status first to reduce dataset size
    const allChefs = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    // Filter out chefs with no meals
    const chefsWithMeals = await Promise.all(
      allChefs.map(async (chef) => {
        const hasMeals = await chefHasMeals(ctx, chef._id);
        return hasMeals ? chef : null;
      })
    );
    const filteredChefs = chefsWithMeals.filter((chef): chef is NonNullable<typeof chef> => chef !== null);
    
    // Calculate distances and filter by radius
    const chefsWithDistance = filteredChefs.map(chef => {
      const chefLat = chef.location?.coordinates?.[0];
      const chefLng = chef.location?.coordinates?.[1];
      
      if (!chefLat || !chefLng) return null;
      
      const dLat = toRad(chefLat - latitude);
      const dLng = toRad(chefLng - longitude);
      const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(chefLat)) * Math.sin(dLng/2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = earthRadiusKm * c;
      
      // Calculate delivery time based on distance
      const deliveryTimeMinutes = calculateDeliveryTimeFromLocations(
        chefLat,
        chefLng,
        latitude,
        longitude
      );
      const deliveryTime = formatDeliveryTime(deliveryTimeMinutes);
      
      return { ...chef, distance, deliveryTime };
    }).filter((chef): chef is NonNullable<typeof chef> => chef !== null && chef.distance <= radiusKm);
    
    // Sort: online chefs first, then by distance
    chefsWithDistance.sort((a, b) => {
      // Prioritize online chefs (isAvailable === true)
      const aOnline = a.isAvailable === true ? 1 : 0;
      const bOnline = b.isAvailable === true ? 1 : 0;
      if (aOnline !== bOnline) {
        return bOnline - aOnline; // Online chefs first
      }
      // If both have same online status, sort by distance
      return a.distance - b.distance;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedChefs = chefsWithDistance.slice(startIndex, endIndex);
    
    return {
      chefs: paginatedChefs,
      total: chefsWithDistance.length
    };
  }
});

// Search chefs by query string
export const searchChefsByQuery = query({
  args: { 
    query: v.string(),
    latitude: v.number(), 
    longitude: v.number(), 
    radiusKm: v.number(),
    cuisine: v.optional(v.string()),
    limit: v.number()
  },
  returns: v.object({
    chefs: v.array(chefWithDistanceValidator),
    total: v.number()
  }),
  handler: async (ctx, args) => {
    const { query: searchQuery, latitude, longitude, radiusKm, cuisine, limit } = args;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const earthRadiusKm = 6371;
    
    // Filter by status first to reduce dataset size
    let chefs = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    // Filter out chefs with no meals
    const chefsWithMeals = await Promise.all(
      chefs.map(async (chef) => {
        const hasMeals = await chefHasMeals(ctx, chef._id);
        return hasMeals ? chef : null;
      })
    );
    chefs = chefsWithMeals.filter((chef): chef is NonNullable<typeof chef> => chef !== null);
    
    // Filter by cuisine if specified
    if (cuisine) {
      chefs = chefs.filter(chef => 
        chef.specialties?.some(specialty => 
          specialty.toLowerCase().includes(cuisine.toLowerCase())
        )
      );
    }
    
    // Filter by search query
    const queryLower = searchQuery.toLowerCase();
    chefs = chefs.filter(chef => 
      chef.name?.toLowerCase().includes(queryLower) ||
      chef.specialties?.some(specialty => 
        specialty.toLowerCase().includes(queryLower)
      ) ||
      chef.bio?.toLowerCase().includes(queryLower) ||
      chef.location?.city?.toLowerCase().includes(queryLower)
    );
    
    // Calculate distances and filter by radius
    const chefsWithDistance = chefs.map(chef => {
      const chefLat = chef.location?.coordinates?.[0];
      const chefLng = chef.location?.coordinates?.[1];
      
      if (!chefLat || !chefLng) return null;
      
      const dLat = toRad(chefLat - latitude);
      const dLng = toRad(chefLng - longitude);
      const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(chefLat)) * Math.sin(dLng/2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = earthRadiusKm * c;
      
      // Calculate delivery time based on distance
      const deliveryTimeMinutes = calculateDeliveryTimeFromLocations(
        chefLat,
        chefLng,
        latitude,
        longitude
      );
      const deliveryTime = formatDeliveryTime(deliveryTimeMinutes);
      
      return { ...chef, distance, deliveryTime };
    }).filter((chef): chef is NonNullable<typeof chef> => chef !== null && chef.distance <= radiusKm);
    
    // Sort: online chefs first, then by distance
    chefsWithDistance.sort((a, b) => {
      // Prioritize online chefs (isAvailable === true)
      const aOnline = a.isAvailable === true ? 1 : 0;
      const bOnline = b.isAvailable === true ? 1 : 0;
      if (aOnline !== bOnline) {
        return bOnline - aOnline; // Online chefs first
      }
      // If both have same online status, sort by distance
      return a.distance - b.distance;
    });
    
    // Apply limit
    const limitedChefs = chefsWithDistance.slice(0, limit);
    
    return {
      chefs: limitedChefs,
      total: chefsWithDistance.length
    };
  }
});

// Get favorite chefs for a user (simplified - returns top-rated chefs)
// Chef with favorite info
const chefWithFavoriteValidator = v.object({
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

export const getFavoriteChefs = query({
  args: { 
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(chefWithFavoriteValidator),
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
            q.eq(q.field("favoriteType"), "chef")
          )
        )
        .collect();
      
      // Get the actual chef data for each favorite
      const favoriteChefsResults = await Promise.all(
        favorites.map(async (favorite) => {
          try {
            const chefId = favorite.favoriteId as Id<"chefs">;
            const chef = await ctx.db.get(chefId);
            if (chef && chef.status === 'active') {
              // Check if chef has meals
              const hasMeals = await chefHasMeals(ctx, chefId);
              if (!hasMeals) {
                return null;
              }
              return {
                ...chef,
                isFavorited: true,
                favoriteId: favorite._id,
                favoritedAt: favorite.createdAt
              } as const;
            }
            return null;
          } catch (error) {
            console.error('Failed to get chef data:', error);
            return null;
          }
        })
      );
      
      // Filter out null values - TypeScript type guard ensures proper typing
      const favoriteChefs: Array<{
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
      }> = favoriteChefsResults.filter((chef): chef is NonNullable<typeof chef> => chef !== null);
      
      // Sort: online chefs first, then by favoritedAt (most recently favorited first)
      favoriteChefs.sort((a, b) => {
        // Prioritize online chefs (isAvailable === true)
        const aOnline = a.isAvailable === true ? 1 : 0;
        const bOnline = b.isAvailable === true ? 1 : 0;
        if (aOnline !== bOnline) {
          return bOnline - aOnline; // Online chefs first
        }
        // If both have same online status, sort by most recently favorited
        return b.favoritedAt - a.favoritedAt;
      });
      
      return favoriteChefs;
    } catch (error) {
      console.error('Error fetching favorite chefs:', error);
      return [];
    }
  }
});

// Get top-rated chefs (for try-it features)
export const getTopRatedChefs = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(chefDocValidator),
  handler: async (ctx, args) => {
    try {
      const chefs = await ctx.db.query('chefs').collect();
      
      // Filter out chefs with no meals
      const chefsWithMeals = await Promise.all(
        chefs.map(async (chef) => {
          const hasMeals = await chefHasMeals(ctx, chef._id);
          return hasMeals ? chef : null;
        })
      );
      const filteredChefs = chefsWithMeals.filter((chef): chef is NonNullable<typeof chef> => chef !== null);
      
      // Sort: online chefs first, then by rating, and limit results
      const topChefs = filteredChefs
        .filter(chef => chef.status === 'active')
        .sort((a, b) => {
          // Prioritize online chefs (isAvailable === true)
          const aOnline = a.isAvailable === true ? 1 : 0;
          const bOnline = b.isAvailable === true ? 1 : 0;
          if (aOnline !== bOnline) {
            return bOnline - aOnline; // Online chefs first
          }
          // If both have same online status, sort by rating
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, args.limit || 10);
      
      return topChefs;
    } catch (error) {
      console.error('Error fetching top-rated chefs:', error);
      return [];
    }
  }
});

// Get chef availability
// Chef availability response validator
const chefAvailabilityValidator = v.object({
  isAvailable: v.boolean(),
  availableDays: v.array(v.string()),
  availableHours: v.object({}),
  maxOrdersPerDay: v.number(),
  advanceBookingDays: v.number(),
  specialInstructions: v.string(),
});

export const getAvailability = query({
  args: { chefId: v.id('chefs') },
  returns: v.union(chefAvailabilityValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const chef = await ctx.db.get(args.chefId);
      if (!chef) return null;
      
      // Return availability information from chef profile
      return {
        isAvailable: chef.isAvailable || false,
        availableDays: chef.availableDays || [],
        availableHours: chef.availableHours || {},
        maxOrdersPerDay: chef.maxOrdersPerDay || 10,
        advanceBookingDays: chef.advanceBookingDays || 7,
        specialInstructions: chef.specialInstructions || ''
      };
    } catch (error) {
      console.error('Error fetching chef availability:', error);
      return null;
    }
  }
});

// Get all chef content (recipes, live sessions, videos, meals)
export const getAllChefContent = query({
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
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
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

    // Get recipes by author (chef name)
    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_author', q => q.eq('author', chef.name))
      .filter(q => q.eq(q.field('status'), 'published'))
      .order('desc')
      .take(limit);

    // Get live sessions by chef
    const liveSessions = await ctx.db
      .query('liveSessions')
      .withIndex('by_chef', q => q.eq('chef_id', args.chefId))
      .order('desc')
      .take(limit);

    // Get videos by creator (user ID)
    const videos = await ctx.db
      .query('videoPosts')
      .withIndex('by_creator', q => q.eq('creatorId', chef.userId))
      .filter(q => q.eq(q.field('status'), 'published'))
      .order('desc')
      .take(limit);

    // Get meals by chef
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
 * Internal query to get chef by user ID without authentication
 * Used by actions during seeding and setup flows
 */
export const getChefByUserIdInternal = internalQuery({
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
 * Internal query to get chef by ID without authentication
 * Used by actions during seeding and setup flows
 */
export const getChefByIdInternal = internalQuery({
  args: { 
    chefId: v.id('chefs'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chefId);
  },
}); 