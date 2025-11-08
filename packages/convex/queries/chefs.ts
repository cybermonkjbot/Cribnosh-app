import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { query } from '../_generated/server';

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
  args: {},
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
  handler: async (ctx) => {
    const chefs = await ctx.db.query('chefs').collect();
    return chefs.map(chef => ({
      chefId: chef._id,
      userId: chef.userId,
      city: chef.location.city,
      coordinates: chef.location.coordinates,
      bio: chef.bio,
      specialties: chef.specialties,
      rating: chef.rating,
      status: chef.status
    }));
  }
});

// Get all chefs
export const getAll = query({
  args: {},
  returns: v.array(chefDocValidator),
  handler: async (ctx) => {
    return await ctx.db.query('chefs').collect();
  }
});

export const getChefById = query({
  args: { chefId: v.id('chefs') },
  returns: v.union(chefDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chefId);
  }
});

// Alias for consistency with other queries
export const getById = getChefById;

export const getPendingCuisines = query({
  args: {},
  returns: v.array(cuisineDocValidator),
  handler: async (ctx) => {
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
  args: { status: v.string() },
  returns: v.array(cuisineDocValidator),
  handler: async (ctx, args) => {
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
  args: { userId: v.string() },
  returns: v.union(chefDocValidator, v.null()),
  handler: async (ctx, args) => {
    const chef = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();
    return chef;
  }
});

// Chef with distance (for location queries)
const chefWithDistanceValidator = v.union(
  chefDocValidator,
  v.object({
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
    updatedAt: v.optional(v.number()),
    distance: v.number(),
  })
);

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
    
    const withDistance = chefs
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
        return { ...chef, distance };
      });
    return withDistance.filter(c => c.distance <= maxDistanceKm).sort((a, b) => a.distance - b.distance);
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
    
    // Calculate distances and filter by radius
    const chefsWithDistance = allChefs.map(chef => {
      const chefLat = chef.location?.coordinates?.[0];
      const chefLng = chef.location?.coordinates?.[1];
      
      if (!chefLat || !chefLng) return null;
      
      const dLat = toRad(chefLat - latitude);
      const dLng = toRad(chefLng - longitude);
      const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(chefLat)) * Math.sin(dLng/2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = earthRadiusKm * c;
      
      return { ...chef, distance };
    }).filter((chef): chef is NonNullable<typeof chef> => chef !== null && chef.distance <= radiusKm);
    
    // Sort by distance
    chefsWithDistance.sort((a, b) => a.distance - b.distance);
    
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
      
      return { ...chef, distance };
    }).filter((chef): chef is NonNullable<typeof chef> => chef !== null && chef.distance <= radiusKm);
    
    // Sort by distance
    chefsWithDistance.sort((a, b) => a.distance - b.distance);
    
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
  updatedAt: v.optional(v.number()),
  isFavorited: v.boolean(),
  favoriteId: v.id("userFavorites"),
  favoritedAt: v.number(),
});

export const getFavoriteChefs = query({
  args: { userId: v.id('users') },
  returns: v.array(chefWithFavoriteValidator),
  handler: async (ctx, args) => {
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
      
      // Sort by rating and limit results
      const topChefs = chefs
        .filter(chef => chef.status === 'active')
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
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