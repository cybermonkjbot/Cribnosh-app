import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { QueryCtx, internalQuery, query } from '../_generated/server';
import { isAdmin, isStaff, requireAuth, requireStaff } from '../utils/auth';
import { getFormattedDeliveryTime } from '../utils/timeCalculations';
import { filterAndRankMealsByPreferences, getUserPreferences } from '../utils/userPreferencesFilter';

interface MealDoc {
  _id: Id<'meals'>;
  chefId: Id<'chefs'>;
  rating?: number;
  [key: string]: unknown;
}

interface ChefDoc {
  _id: Id<'chefs'>;
  name?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  profileImage?: string | null;
  [key: string]: unknown;
}

interface ReviewDoc {
  rating?: number;
  [key: string]: unknown;
}

export const getAll = query({
  args: {
    userId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { userId?: Id<'users'>; limit?: number; offset?: number; status?: string }) => {
    const { limit, offset = 0, status } = args;
    
    // Build query with optional status filter
    let mealsQuery = ctx.db.query('meals');
    if (status) {
      mealsQuery = mealsQuery.filter(q => q.eq(q.field('status'), status));
    }
    const meals = await mealsQuery.collect();
    
    // Batch fetch all chefs and reviews to avoid N+1 queries
    const chefIds = new Set(meals.map((meal: MealDoc) => meal.chefId));
    const chefs = await Promise.all(
      Array.from(chefIds).map(id => ctx.db.get(id))
    );
    const chefMap = new Map<Id<'chefs'>, ChefDoc>();
    for (const chef of chefs) {
      if (chef) {
        chefMap.set(chef._id, chef as ChefDoc);
      }
    }
    
    // Get reviews only for the meals we fetched (optimized: don't fetch all reviews)
    const mealIds = meals.map((meal: MealDoc) => meal._id);
    const reviewPromises = mealIds.map(mealId => 
      ctx.db.query('reviews')
        .withIndex('by_meal', q => q.eq('meal_id', mealId))
        .collect()
    );
    const reviewArrays = await Promise.all(reviewPromises);
    
    // Create review map by meal ID
    const reviewMap = new Map<Id<'meals'>, ReviewDoc[]>();
    reviewArrays.forEach((reviews, index) => {
      const mealId = mealIds[index];
      if (reviews.length > 0) {
        reviewMap.set(mealId, reviews as ReviewDoc[]);
      }
    });
    
    // Build meals with chef and review data
    const mealsWithChefData = meals.map((meal: MealDoc) => {
      const chef = chefMap.get(meal.chefId);
      const reviews = reviewMap.get(meal._id) || [];
      
      return {
        ...meal,
        chef: chef ? {
          _id: (chef as ChefDoc)._id,
          name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
          bio: (chef as ChefDoc).bio,
          specialties: (chef as ChefDoc).specialties || [],
          rating: (chef as ChefDoc).rating || 0,
          profileImage: (chef as ChefDoc).profileImage,
          verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
          verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
        } : {
          _id: meal.chefId,
          name: `Chef ${meal.chefId}`,
          bio: '',
          specialties: [],
          rating: 0,
          profileImage: null,
        },
        reviewCount: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
          : meal.rating || 0
      };
    });

    // Apply user preference filtering if userId provided
    let filteredMeals = mealsWithChefData;
    if (args.userId) {
      try {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          mealsWithChefData,
          preferences,
          (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
        );
        filteredMeals = scoredMeals.map(s => s.meal);
      } catch (error) {
        // If preference fetching fails, return unfiltered meals
        console.error('Error fetching user preferences:', error);
      }
    }

    // Apply pagination
    if (limit !== undefined) {
      return filteredMeals.slice(offset, offset + limit);
    }
    
    // If no limit, return all from offset
    return filteredMeals.slice(offset);
  },
});

/**
 * Get dishes with details - accepts array of dish IDs and returns all details (meals, chefs, reviews) in one call
 * This consolidates multiple queries into a single batch query
 */
export const getDishesWithDetails = query({
  args: {
    dishIds: v.array(v.id('meals')),
    userId: v.optional(v.id('users')),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { dishIds: Id<'meals'>[]; userId?: Id<'users'> }) => {
    if (args.dishIds.length === 0) {
      return [];
    }
    
    // Get all meals in one query
    const meals = await Promise.all(
      args.dishIds.map(id => ctx.db.get(id))
    );
    
    // Filter out null meals
    const validMeals = meals.filter((meal): meal is MealDoc => meal !== null);
    
    // Get unique chef IDs
    const chefIds = new Set(validMeals.map(meal => meal.chefId));
    
    // Get all chefs in one batch
    const chefs = await Promise.all(
      Array.from(chefIds).map(id => ctx.db.get(id))
    );
    
    // Create chef map for quick lookup
    const chefMap = new Map<Id<'chefs'>, ChefDoc>();
    for (const chef of chefs) {
      if (chef) {
        chefMap.set(chef._id, chef as ChefDoc);
      }
    }
    
    // Get reviews for these specific meals only (filter by meal IDs before collecting)
    // Query reviews for each mealId separately to avoid fetching all reviews
    const reviewPromises = args.dishIds.map(mealId => 
      ctx.db.query('reviews')
        .filter((q) => {
          const mealIdField = q.field('meal_id');
          return q.eq(mealIdField, mealId);
        })
        .collect()
    );
    
    const reviewArrays = await Promise.all(reviewPromises);
    
    // Create review map by meal ID
    const reviewMap = new Map<Id<'meals'>, ReviewDoc[]>();
    reviewArrays.forEach((reviews, index) => {
      const mealId = args.dishIds[index];
      if (reviews.length > 0) {
        reviewMap.set(mealId, reviews as ReviewDoc[]);
      }
    });
    
    // Build result with all details
    let dishesWithDetails = validMeals.map((meal: MealDoc) => {
      const chef = chefMap.get(meal.chefId);
      const reviews = reviewMap.get(meal._id) || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
        : meal.rating || 0;
      
      return {
        ...meal,
        chef: chef ? {
          _id: chef._id,
          name: chef.name || `Chef ${chef._id}`,
          bio: chef.bio,
          specialties: chef.specialties || [],
          rating: chef.rating || 0,
          profileImage: chef.profileImage,
          verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
          verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
        } : {
          _id: meal.chefId,
          name: `Chef ${meal.chefId}`,
          bio: '',
          specialties: [],
          rating: 0,
          profileImage: null,
        },
        reviewCount: reviews.length,
        averageRating: avgRating,
        reviews: reviews,
      };
    });
    
    // Apply user preference filtering if userId provided
    if (args.userId) {
      try {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          dishesWithDetails,
          preferences,
          (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
        );
        dishesWithDetails = scoredMeals.map(s => s.meal);
      } catch (error) {
        // If preference fetching fails, return unfiltered meals
        console.error('Error fetching user preferences:', error);
      }
    }
    
    return dishesWithDetails;
  },
});

export const getPending = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db.query('meals').filter((q) => q.eq(q.field('status'), 'pending')).collect();
  },
});

export const get = query({
  args: { mealId: v.id('meals') },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx: QueryCtx, args: { mealId: Id<'meals'> }) => {
    return await ctx.db.get(args.mealId);
  },
});

export const getById = query({
  args: { mealId: v.id('meals') },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx: QueryCtx, args: { mealId: Id<'meals'> }) => {
    return await ctx.db.get(args.mealId);
  },
});

export const getByChefId = query({
  args: { 
    chefId: v.id('chefs'),
    userId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    category: v.optional(v.string()),
    dietary: v.optional(v.array(v.string())),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { 
    chefId: Id<'chefs'>;
    userId?: Id<'users'>;
    limit?: number;
    offset?: number;
    category?: string;
    dietary?: string[];
  }) => {
    const limit = args.limit || 10;
    const offset = args.offset || 0;
    
    let meals = await ctx.db
      .query('meals')
      .filter((q) => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Apply filters
    if (args.category) {
      meals = meals.filter((meal: MealDoc) => {
        const mealAny = meal as { category?: string; cuisine?: string[]; [key: string]: unknown };
        return mealAny.category?.toLowerCase() === args.category!.toLowerCase() ||
          mealAny.cuisine?.some((c: string) => c.toLowerCase() === args.category!.toLowerCase());
      });
    }
    
    if (args.dietary && args.dietary.length > 0) {
      meals = meals.filter((meal: MealDoc) => {
        const mealAny = meal as { dietaryInfo?: { vegetarian?: boolean; vegan?: boolean; glutenFree?: boolean }; allergens?: string[]; [key: string]: unknown };
        return args.dietary!.some((diet: string) => 
          mealAny.dietaryInfo?.vegetarian && diet === 'vegetarian' ||
          mealAny.dietaryInfo?.vegan && diet === 'vegan' ||
          mealAny.dietaryInfo?.glutenFree && diet === 'gluten-free' ||
          mealAny.allergens?.some((a: string) => a.toLowerCase() === diet.toLowerCase())
        );
      });
    }
    
    // Filter by status (only available meals)
    meals = meals.filter((meal: MealDoc) => {
      const mealAny = meal as { status?: string; [key: string]: unknown };
      return mealAny.status === 'available' || mealAny.status === 'active';
    });
    
    // Get chef data for meals
    const chefIds = new Set(meals.map((meal: MealDoc) => meal.chefId));
    const chefs = await Promise.all(
      Array.from(chefIds).map(id => ctx.db.get(id))
    );
    const chefMap = new Map<Id<'chefs'>, ChefDoc>();
    for (const chef of chefs) {
      if (chef) {
        chefMap.set(chef._id, chef as ChefDoc);
      }
    }
    
    // Get reviews for rating calculation
    const mealsWithReviews = await Promise.all(
      meals.map(async (meal: MealDoc) => {
        const reviews = await ctx.db
          .query('reviews')
          .filter((q) => q.eq(q.field('mealId'), meal._id))
          .collect();
        
        const chef = chefMap.get(meal.chefId);
        
        return {
          ...meal,
          chef: chef ? {
            _id: (chef as ChefDoc)._id,
            name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
            bio: (chef as ChefDoc).bio,
            specialties: (chef as ChefDoc).specialties || [],
            rating: (chef as ChefDoc).rating || 0,
            profileImage: (chef as ChefDoc).profileImage,
            verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
            verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
          } : {
            _id: meal.chefId,
            name: `Chef ${meal.chefId}`,
            bio: '',
            specialties: [],
            rating: 0,
            profileImage: null,
          },
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      })
    );
    
    // Apply user preference filtering if userId provided
    let results = mealsWithReviews;
    if (args.userId) {
      try {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          mealsWithReviews,
          preferences,
          (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
        );
        results = scoredMeals.map(s => s.meal);
      } catch (error) {
        // If preference fetching fails, return unfiltered meals
        console.error('Error fetching user preferences:', error);
        results = mealsWithReviews;
      }
    }
    
    return results.slice(offset, offset + limit);
  },
});

// Get all meals by chef ID for management (includes all statuses)
export const getAllByChefIdForManagement = query({
  args: { 
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { 
    chefId: Id<'chefs'>;
    sessionToken?: string;
  }) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only view meals for their own chef profile, staff/admin can view any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Get all meals for this chef (no status filtering)
    const meals = await ctx.db
      .query('meals')
      .filter((q) => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Get reviews for rating calculation
    const mealsWithReviews = await Promise.all(
      meals.map(async (meal: MealDoc) => {
        const reviews = await ctx.db
          .query('reviews')
          .withIndex('by_meal', (q) => q.eq('meal_id', meal._id))
          .collect();
        
        return {
          ...meal,
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      })
    );
    
    // Sort by creation date (newest first)
    return mealsWithReviews.sort((a, b) => {
      const aTime = (a as { createdAt?: number }).createdAt || 0;
      const bTime = (b as { createdAt?: number }).createdAt || 0;
      return bTime - aTime;
    });
  },
});

// Get popular meals by chef ID (sorted by rating/reviews)
export const getPopularByChefId = query({
  args: { 
    chefId: v.id('chefs'),
    userId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { 
    chefId: Id<'chefs'>;
    userId?: Id<'users'>;
    limit?: number;
  }) => {
    const limit = args.limit || 10;
    
    let meals = await ctx.db
      .query('meals')
      .filter((q) => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Filter by status (only available meals)
    meals = meals.filter((meal: MealDoc) => {
      const mealAny = meal as { status?: string; [key: string]: unknown };
      return mealAny.status === 'available' || mealAny.status === 'active';
    });
    
    // Get reviews and calculate popularity score
    const mealsWithPopularity = await Promise.all(
      meals.map(async (meal: MealDoc) => {
        const reviews = await ctx.db
          .query('reviews')
          .filter((q) => q.eq(q.field('mealId'), meal._id))
          .collect();
        
        const reviewCount = reviews.length;
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
          : meal.rating || 0;
        
        // Popularity score: rating * log(reviewCount + 1) to balance rating and review count
        const popularityScore = averageRating * Math.log(reviewCount + 1);
        
        return {
          ...meal,
          reviewCount,
          averageRating,
          popularityScore,
        };
      })
    );
    
    // Apply user preference filtering if userId provided
    let results: Array<MealDoc & { reviewCount: number; averageRating: number; popularityScore: number }> = mealsWithPopularity;
    if (args.userId) {
      try {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          mealsWithPopularity,
          preferences,
          (meal: MealDoc & { popularityScore?: number }) => meal.popularityScore || 0
        );
        results = scoredMeals.map((s: { meal: MealDoc & { reviewCount: number; averageRating: number; popularityScore: number } }) => s.meal);
      } catch (error) {
        // If preference fetching fails, return unfiltered meals
        console.error('Error fetching user preferences:', error);
        results = mealsWithPopularity;
      }
    } else {
      // Sort by popularity score if no user preferences
      results.sort((a: MealDoc & { popularityScore?: number }, b: MealDoc & { popularityScore?: number }) => (b.popularityScore || 0) - (a.popularityScore || 0));
    }
    
    return results.slice(0, limit);
  },
});

// Get categories by chef ID
export const getCategoriesByChefId = query({
  args: { 
    chefId: v.id('chefs'),
  },
  returns: v.array(v.object({
    category: v.string(),
    count: v.number(),
  })),
  handler: async (ctx: QueryCtx, args: { chefId: Id<'chefs'> }) => {
    const meals = await ctx.db
      .query('meals')
      .filter((q) => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Filter by status (only available meals)
    const availableMeals = meals.filter((meal: MealDoc) => {
      const mealAny = meal as { status?: string; [key: string]: unknown };
      return mealAny.status === 'available' || mealAny.status === 'active';
    });
    
    // Aggregate by category
    const categoryMap = new Map<string, number>();
    
    availableMeals.forEach((meal: MealDoc) => {
      const mealAny = meal as { category?: string; cuisine?: string[]; [key: string]: unknown };
      // Use category if exists, otherwise use first cuisine type
      const category = mealAny.category || (mealAny.cuisine && Array.isArray(mealAny.cuisine) ? mealAny.cuisine[0] : undefined) || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    })).sort((a: { category: string; count: number }, b: { category: string; count: number }) => b.count - a.count);
  },
});

// Search meals by chef ID
export const searchMealsByChefId = query({
  args: {
    chefId: v.id('chefs'),
    query: v.string(),
    userId: v.optional(v.id('users')),
    category: v.optional(v.string()),
    dietary: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: {
    chefId: Id<'chefs'>;
    query: string;
    userId?: Id<'users'>;
    category?: string;
    dietary?: string[];
    limit?: number;
  }) => {
    const limit = args.limit || 20;
    
    let meals = await ctx.db
      .query('meals')
      .filter((q) => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Filter by status (only available meals)
    meals = meals.filter((meal: MealDoc) => {
      const mealAny = meal as { status?: string; [key: string]: unknown };
      return mealAny.status === 'available' || mealAny.status === 'active';
    });
    
    // Filter by search query
    if (args.query) {
      const searchTerm = args.query.toLowerCase();
      meals = meals.filter((meal: MealDoc) => {
        const mealAny = meal as { name?: string; description?: string; cuisine?: string[]; ingredients?: string[]; [key: string]: unknown };
        return mealAny.name?.toLowerCase().includes(searchTerm) ||
          mealAny.description?.toLowerCase().includes(searchTerm) ||
          mealAny.cuisine?.some((c: string) => c.toLowerCase().includes(searchTerm)) ||
          mealAny.ingredients?.some((i: string) => i.toLowerCase().includes(searchTerm));
      });
    }
    
    // Apply category filter
    if (args.category) {
      meals = meals.filter((meal: MealDoc) => {
        const mealAny = meal as { category?: string; cuisine?: string[]; [key: string]: unknown };
        return mealAny.category?.toLowerCase() === args.category!.toLowerCase() ||
          mealAny.cuisine?.some((c: string) => c.toLowerCase() === args.category!.toLowerCase());
      });
    }
    
    // Apply dietary filter
    if (args.dietary && args.dietary.length > 0) {
      meals = meals.filter((meal: MealDoc) => {
        const mealAny = meal as { dietaryInfo?: { vegetarian?: boolean; vegan?: boolean; glutenFree?: boolean }; allergens?: string[]; [key: string]: unknown };
        return args.dietary!.some((diet: string) => 
          mealAny.dietaryInfo?.vegetarian && diet === 'vegetarian' ||
          mealAny.dietaryInfo?.vegan && diet === 'vegan' ||
          mealAny.dietaryInfo?.glutenFree && diet === 'gluten-free' ||
          mealAny.allergens?.some((a: string) => a.toLowerCase() === diet.toLowerCase())
        );
      });
    }
    
    // Get reviews for rating
    const mealsWithReviews = await Promise.all(
      meals.map(async (meal: MealDoc) => {
        const reviews = await ctx.db
          .query('reviews')
          .filter((q) => q.eq(q.field('mealId'), meal._id))
          .collect();
        
        return {
          ...meal,
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      })
    );
    
    // Apply user preference filtering if userId provided
    let results: Array<MealDoc & { reviewCount: number; averageRating: number }> = mealsWithReviews;
    if (args.userId) {
      const preferences = await getUserPreferences(ctx, args.userId);
      const scoredMeals = filterAndRankMealsByPreferences(
        mealsWithReviews,
        preferences,
        (meal: MealDoc & { averageRating?: number; reviewCount?: number }) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
      );
      results = scoredMeals.map((s: { meal: MealDoc & { reviewCount: number; averageRating: number } }) => s.meal);
    } else {
      // Sort by rating if no user preferences
      results.sort((a: MealDoc & { averageRating?: number }, b: MealDoc & { averageRating?: number }) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    
    return results.slice(0, limit);
  },
});

// Search meals with filters
export const searchMeals = query({
  args: {
    query: v.string(),
    userId: v.optional(v.id('users')),
    filters: v.optional(v.object({
      cuisine: v.optional(v.string()),
      priceRange: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number())
      })),
      dietary: v.optional(v.array(v.string()))
    }))
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: {
    query: string;
    userId?: Id<'users'>;
    filters?: {
      cuisine?: string;
      priceRange?: { min?: number; max?: number };
      dietary?: string[];
    };
  }) => {
    try {
      let meals = await ctx.db.query('meals').collect();
      
      // Filter by search query
      if (args.query) {
        const searchTerm = args.query.toLowerCase();
        meals = meals.filter((meal: MealDoc) => {
          const mealAny = meal as { name?: string; description?: string; cuisine?: string[]; [key: string]: unknown };
          return mealAny.name?.toLowerCase().includes(searchTerm) ||
            mealAny.description?.toLowerCase().includes(searchTerm) ||
            mealAny.cuisine?.some((c: string) => c.toLowerCase().includes(searchTerm));
        });
      }
      
      // Apply additional filters
      if (args.filters) {
        if (args.filters.cuisine) {
          meals = meals.filter((meal: MealDoc) => {
            const mealAny = meal as { cuisine?: string[]; [key: string]: unknown };
            return mealAny.cuisine?.some((c: string) => c.toLowerCase() === args.filters!.cuisine!.toLowerCase());
          });
        }
        
        if (args.filters.priceRange) {
          const { min, max } = args.filters.priceRange;
          meals = meals.filter((meal: MealDoc) => {
            const mealAny = meal as { price?: number; [key: string]: unknown };
            if (min !== undefined && mealAny.price !== undefined && mealAny.price < min) return false;
            if (max !== undefined && mealAny.price !== undefined && mealAny.price > max) return false;
            return true;
          });
        }
        
        if (args.filters.dietary && args.filters.dietary.length > 0) {
          meals = meals.filter((meal: MealDoc) => {
            const mealAny = meal as { dietary?: string[]; [key: string]: unknown };
            if (!mealAny.dietary || mealAny.dietary.length === 0) return false;
            // Case-insensitive matching for dietary restrictions
            const mealDietaryLower = mealAny.dietary.map((d: string) => d.toLowerCase());
            return args.filters!.dietary!.some((diet: string) => 
              mealDietaryLower.includes(diet.toLowerCase())
            );
          });
        }
      }
      
      // Sort by rating and limit results
      const filteredMeals = meals
        .filter((meal: MealDoc) => {
          const mealAny = meal as { status?: string; [key: string]: unknown };
          return mealAny.status === 'available';
        })
        .sort((a: MealDoc, b: MealDoc) => ((b as { rating?: number }).rating || 0) - ((a as { rating?: number }).rating || 0))
        .slice(0, 20);

      // Batch fetch all chefs and reviews to avoid N+1 queries
      const chefIds = new Set(filteredMeals.map((meal: MealDoc) => meal.chefId));
      const chefs = await Promise.all(
        Array.from(chefIds).map(id => ctx.db.get(id))
      );
      const chefMap = new Map<Id<'chefs'>, ChefDoc>();
      for (const chef of chefs) {
        if (chef) {
          chefMap.set(chef._id, chef as ChefDoc);
        }
      }
      
      // Get all reviews in one query and group by mealId
      const allReviews = await ctx.db.query('reviews').collect();
      const reviewMap = new Map<Id<'meals'>, ReviewDoc[]>();
      for (const review of allReviews) {
        const mealId = (review as any).mealId || (review as any).meal_id;
        if (mealId) {
          if (!reviewMap.has(mealId)) {
            reviewMap.set(mealId, []);
          }
          reviewMap.get(mealId)!.push(review as ReviewDoc);
        }
      }

      // Build meals with chef and review data
      const mealsWithChefData = filteredMeals.map((meal: MealDoc) => {
        const chef = chefMap.get(meal.chefId);
        const reviews = reviewMap.get(meal._id) || [];
        
        return {
          ...meal,
          chef: chef ? {
            _id: (chef as ChefDoc)._id,
            name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
            bio: (chef as ChefDoc).bio,
            specialties: (chef as ChefDoc).specialties || [],
            rating: (chef as ChefDoc).rating || 0,
            profileImage: (chef as ChefDoc).profileImage,
            verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
            verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
          } : {
            _id: meal.chefId,
            name: `Chef ${meal.chefId}`,
            bio: '',
            specialties: [],
            rating: 0,
            profileImage: null,
          },
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      });

      let results: Array<MealDoc & { chef: ChefDoc; reviewCount: number; averageRating: number }> = mealsWithChefData;

      // Apply user preference filtering if userId provided
      if (args.userId) {
        try {
          const preferences = await getUserPreferences(ctx, args.userId);
          const scoredMeals = filterAndRankMealsByPreferences(
            mealsWithChefData,
            preferences,
            (meal: MealDoc & { averageRating?: number; reviewCount?: number }) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
          );
          results = scoredMeals.map((s: { meal: MealDoc & { chef: ChefDoc; reviewCount: number; averageRating: number } }) => s.meal);
        } catch (error) {
          // If preference fetching fails, return unfiltered meals
          console.error('Error fetching user preferences:', error);
          results = mealsWithChefData;
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching meals:', error);
      return [];
    }
  }
});

// Get search suggestions
export const getSearchSuggestions = query({
  args: { 
    query: v.string(),
    userId: v.optional(v.id('users'))
  },
  returns: v.array(v.string()),
  handler: async (ctx: QueryCtx, args: { query: string; userId?: Id<'users'> }) => {
    try {
      if (args.query.length < 2) return [];
      
      // Get meals - will be filtered by preferences if userId provided
      const allMeals = await ctx.db.query('meals').collect();
      
      // Apply user preference filtering if userId provided
      let meals = allMeals;
      if (args.userId) {
        try {
          const preferences = await getUserPreferences(ctx, args.userId);
          const scoredMeals = filterAndRankMealsByPreferences(
            allMeals.map((meal: MealDoc) => ({ ...meal })),
            preferences,
            () => 0 // Base score doesn't matter for suggestions
          );
          meals = scoredMeals.map((s: { meal: MealDoc }) => s.meal);
        } catch (error) {
          // If preference fetching fails, use all meals
          console.error('Error fetching user preferences:', error);
          meals = allMeals;
        }
      }
      
      const searchTerm = args.query.toLowerCase();
      
      // Get meal names and cuisines that match
      const suggestions = new Set<string>();
      
      meals.forEach((meal: MealDoc) => {
        const mealAny = meal as { name?: string; cuisine?: string[]; [key: string]: unknown };
        if (mealAny.name && typeof mealAny.name === 'string' && mealAny.name.toLowerCase().includes(searchTerm)) {
          suggestions.add(mealAny.name);
        }
        if (mealAny.cuisine && Array.isArray(mealAny.cuisine)) {
          mealAny.cuisine.forEach((cuisine: string) => {
            if (typeof cuisine === 'string' && cuisine.toLowerCase().includes(searchTerm)) {
              suggestions.add(cuisine);
            }
          });
        }
      });
      
      return Array.from(suggestions).slice(0, 10);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
});

// Get available meals (alias for getAll with status filter)
export const getAvailable = query({
  args: {
    userId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { userId?: Id<'users'>; limit?: number; offset?: number; latitude?: number; longitude?: number }) => {
    const meals = await ctx.db.query('meals')
      .filter((q) => q.or(
        q.eq(q.field('status'), 'available'),
        q.eq(q.field('status'), 'active')
      ))
      .collect();
    
    // Batch fetch all chefs and reviews to avoid N+1 queries
    const chefIds = new Set(meals.map((meal: MealDoc) => meal.chefId));
    const chefs = await Promise.all(
      Array.from(chefIds).map(id => ctx.db.get(id))
    );
    const chefMap = new Map<Id<'chefs'>, ChefDoc>();
    for (const chef of chefs) {
      if (chef) {
        chefMap.set(chef._id, chef as ChefDoc);
      }
    }
    
    // Get all reviews in one query and group by mealId
    const allReviews = await ctx.db.query('reviews').collect();
    const reviewMap = new Map<Id<'meals'>, ReviewDoc[]>();
    for (const review of allReviews) {
      const mealId = (review as any).mealId || (review as any).meal_id;
      if (mealId) {
        if (!reviewMap.has(mealId)) {
          reviewMap.set(mealId, []);
        }
        reviewMap.get(mealId)!.push(review as ReviewDoc);
      }
    }
    
    // Build meals with chef and review data
    const mealsWithChefData = meals.map((meal: MealDoc) => {
      const chef = chefMap.get(meal.chefId);
      const reviews = reviewMap.get(meal._id) || [];
      
      // Calculate delivery time if user location and chef location are available
      let deliveryTime: string | null = null;
      if (args.latitude && args.longitude && chef) {
        const chefLocation = (chef as any).location;
        if (chefLocation?.coordinates && Array.isArray(chefLocation.coordinates) && chefLocation.coordinates.length === 2) {
          const [chefLat, chefLng] = chefLocation.coordinates;
          const mealAny = meal as { prepTime?: string; prep_time?: string };
          // Parse prep time if available (format: "20 min" or "20")
          let prepTimeMinutes: number | null = null;
          if (mealAny.prepTime || mealAny.prep_time) {
            const prepTimeStr = mealAny.prepTime || mealAny.prep_time || '';
            const match = prepTimeStr.match(/(\d+)/);
            if (match) {
              prepTimeMinutes = parseInt(match[1], 10);
            }
          }
          try {
            deliveryTime = getFormattedDeliveryTime(
              chefLat,
              chefLng,
              args.latitude,
              args.longitude,
              prepTimeMinutes
            );
          } catch (error) {
            // If calculation fails, leave deliveryTime as null
            console.error('Error calculating delivery time:', error);
          }
        }
      }
      
      return {
        ...meal,
        chef: chef ? {
          _id: (chef as ChefDoc)._id,
          name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
          bio: (chef as ChefDoc).bio,
          specialties: (chef as ChefDoc).specialties || [],
          rating: (chef as ChefDoc).rating || 0,
          profileImage: (chef as ChefDoc).profileImage,
          verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
          verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
        } : {
          _id: meal.chefId,
          name: `Chef ${meal.chefId}`,
          bio: '',
          specialties: [],
          rating: 0,
          profileImage: null,
        },
        reviewCount: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
          : meal.rating || 0,
        deliveryTime,
      };
    });

    // Apply user preference filtering if userId provided
    let results = mealsWithChefData;
    if (args.userId) {
      try {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          mealsWithChefData,
          preferences,
          (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
        );
        results = scoredMeals.map(s => s.meal);
      } catch (error) {
        // If preference fetching fails, return unfiltered meals
        console.error('Error fetching user preferences:', error);
        results = mealsWithChefData;
      }
    }

    // Apply pagination if limit/offset provided
    if (args.limit !== undefined) {
      const offset = args.offset || 0;
      return results.slice(offset, offset + args.limit);
    }

    return results;
  },
});

// Search meals (alias for searchMeals)
export const search = query({
  args: {
    query: v.string(),
    userId: v.optional(v.id('users')),
    filters: v.optional(v.object({
      cuisine: v.optional(v.string()),
      priceRange: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number())
      })),
      dietary: v.optional(v.array(v.string()))
    })),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: {
    query: string;
    userId?: Id<'users'>;
    filters?: {
      cuisine?: string;
      priceRange?: { min?: number; max?: number };
      dietary?: string[];
    };
    limit?: number;
    offset?: number;
  }) => {
    try {
      let meals = await ctx.db.query('meals').collect();
      
      // Filter by search query
      if (args.query) {
        const searchTerm = args.query.toLowerCase();
        meals = meals.filter((meal: MealDoc) => {
          const mealAny = meal as { name?: string; description?: string; cuisine?: string[]; [key: string]: unknown };
          return mealAny.name?.toLowerCase().includes(searchTerm) ||
            mealAny.description?.toLowerCase().includes(searchTerm) ||
            mealAny.cuisine?.some((c: string) => c.toLowerCase().includes(searchTerm));
        });
      }
      
      // Apply additional filters
      if (args.filters) {
        if (args.filters.cuisine) {
          meals = meals.filter((meal: MealDoc) => {
            const mealAny = meal as { cuisine?: string[]; [key: string]: unknown };
            return mealAny.cuisine?.some((c: string) => c.toLowerCase() === args.filters!.cuisine!.toLowerCase());
          });
        }
        
        if (args.filters.priceRange) {
          const { min, max } = args.filters.priceRange;
          meals = meals.filter((meal: MealDoc) => {
            const mealAny = meal as { price?: number; [key: string]: unknown };
            if (min !== undefined && mealAny.price !== undefined && mealAny.price < min) return false;
            if (max !== undefined && mealAny.price !== undefined && mealAny.price > max) return false;
            return true;
          });
        }
        
        if (args.filters.dietary && args.filters.dietary.length > 0) {
          meals = meals.filter((meal: MealDoc) => {
            const mealAny = meal as { dietary?: string[]; [key: string]: unknown };
            if (!mealAny.dietary || mealAny.dietary.length === 0) return false;
            // Case-insensitive matching for dietary restrictions
            const mealDietaryLower = mealAny.dietary.map((d: string) => d.toLowerCase());
            return args.filters!.dietary!.some((diet: string) => 
              mealDietaryLower.includes(diet.toLowerCase())
            );
          });
        }
      }
      
      // Sort by rating (pagination will be applied later)
      const filteredMeals = meals
        .filter((meal: MealDoc) => {
          const mealAny = meal as { status?: string; [key: string]: unknown };
          return mealAny.status === 'available';
        })
        .sort((a: MealDoc, b: MealDoc) => ((b as { rating?: number }).rating || 0) - ((a as { rating?: number }).rating || 0));

      // Batch fetch all chefs and reviews to avoid N+1 queries
      const chefIds = new Set(filteredMeals.map((meal: MealDoc) => meal.chefId));
      const chefs = await Promise.all(
        Array.from(chefIds).map(id => ctx.db.get(id))
      );
      const chefMap = new Map<Id<'chefs'>, ChefDoc>();
      for (const chef of chefs) {
        if (chef) {
          chefMap.set(chef._id, chef as ChefDoc);
        }
      }
      
      // Get all reviews in one query and group by mealId
      const allReviews = await ctx.db.query('reviews').collect();
      const reviewMap = new Map<Id<'meals'>, ReviewDoc[]>();
      for (const review of allReviews) {
        const mealId = (review as any).mealId || (review as any).meal_id;
        if (mealId) {
          if (!reviewMap.has(mealId)) {
            reviewMap.set(mealId, []);
          }
          reviewMap.get(mealId)!.push(review as ReviewDoc);
        }
      }

      // Build meals with chef and review data
      const mealsWithChefData = filteredMeals.map((meal: MealDoc) => {
        const chef = chefMap.get(meal.chefId);
        const reviews = reviewMap.get(meal._id) || [];
        
        return {
          ...meal,
          chef: chef ? {
            _id: (chef as ChefDoc)._id,
            name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
            bio: (chef as ChefDoc).bio,
            specialties: (chef as ChefDoc).specialties || [],
            rating: (chef as ChefDoc).rating || 0,
            profileImage: (chef as ChefDoc).profileImage,
            verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
            verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
          } : {
            _id: meal.chefId,
            name: `Chef ${meal.chefId}`,
            bio: '',
            specialties: [],
            rating: 0,
            profileImage: null,
          },
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      });

      let results: Array<MealDoc & { chef: ChefDoc; reviewCount: number; averageRating: number }> = mealsWithChefData;

      // Apply user preference filtering if userId provided
      if (args.userId) {
        try {
          const preferences = await getUserPreferences(ctx, args.userId);
          const scoredMeals = filterAndRankMealsByPreferences(
            mealsWithChefData,
            preferences,
            (meal: MealDoc & { averageRating?: number; reviewCount?: number }) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
          );
          results = scoredMeals.map((s: { meal: MealDoc & { chef: ChefDoc; reviewCount: number; averageRating: number } }) => s.meal);
        } catch (error) {
          // If preference fetching fails, return unfiltered meals
          console.error('Error fetching user preferences:', error);
          results = mealsWithChefData;
        }
      }

      // Apply pagination if limit/offset provided
      if (args.limit !== undefined) {
        const offset = args.offset || 0;
        return results.slice(offset, offset + args.limit);
      }

      return results;
    } catch (error) {
      console.error('Error searching meals:', error);
      return [];
    }
  },
});

// Get unique cuisines from meals (optimized - doesn't load all meal data)
export const getCuisines = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx: QueryCtx) => {
    const meals = await ctx.db.query('meals').collect();
    const cuisines = new Set<string>();
    
    for (const meal of meals) {
      const mealAny = meal as { cuisine?: string[]; [key: string]: unknown };
      if (mealAny.cuisine && Array.isArray(mealAny.cuisine)) {
        mealAny.cuisine.forEach((c: string) => {
          if (c && typeof c === 'string') {
            cuisines.add(c);
          }
        });
      }
    }
    
    return Array.from(cuisines).sort();
  },
});

// Get user's previous meals
export const getPreviousMeals = query({
  args: { 
    userId: v.id('users'),
    applyPreferences: v.optional(v.boolean()),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { userId: Id<'users'>; applyPreferences?: boolean; sessionToken?: string }) => {
    // Require authentication - users can only access their own previous meals
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own previous meals, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    try {
      // Get user's order history
      const orders = await ctx.db
        .query('orders')
        .filter((q) => q.eq(q.field('customer_id'), args.userId))
        .collect();
      
      // Extract meal IDs from orders
      const mealIds = new Set<string>();
      orders.forEach((order: { order_items?: Array<{ dish_id?: string }>; [key: string]: unknown }) => {
        const orderAny = order as { order_items?: Array<{ dish_id?: string }>; [key: string]: unknown };
        if (orderAny.order_items && Array.isArray(orderAny.order_items)) {
          orderAny.order_items.forEach((item: { dish_id?: string }) => {
            if (item.dish_id) {
              mealIds.add(item.dish_id);
            }
          });
        }
      });
      
      // Get meal details
      const previousMeals = await Promise.all(
        Array.from(mealIds).map(async (mealId: string) => {
          return await ctx.db.get(mealId as Id<'meals'>);
        })
      );
      
      let results = previousMeals
        .filter((meal): meal is MealDoc => meal !== null)
        .sort((a: MealDoc, b: MealDoc) => ((b as { rating?: number }).rating || 0) - ((a as { rating?: number }).rating || 0));

      // Apply user preference filtering if requested
      if (args.applyPreferences !== false) {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          results,
          preferences,
          (meal: MealDoc) => ((meal as { rating?: number }).rating || 0) * 10
        );
        results = scoredMeals.map((s: { meal: MealDoc }) => s.meal);
      }

      return results;
    } catch (error) {
      console.error('Error fetching previous meals:', error);
      return [];
    }
  }
});

/**
 * Get random meals for shake-to-eat feature
 * Returns a random selection of available meals
 */
export const getRandomMeals = query({
  args: {
    userId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { userId?: Id<'users'>; limit?: number; latitude?: number; longitude?: number }) => {
    const limit = args.limit || 20;
    
    try {
      // Get all available meals
      const allMeals = await ctx.db
        .query('meals')
        .filter((q) => {
          const mealAny = q as { status?: string };
          return q.or(
            q.eq(q.field('status'), 'available'),
            q.eq(q.field('status'), 'active')
          );
        })
        .collect();
      
      if (allMeals.length === 0) {
        return [];
      }
      
      // Get chef data for all meals before applying preferences
      const chefIds = new Set(allMeals.map((meal: MealDoc) => meal.chefId));
      const chefs = await Promise.all(
        Array.from(chefIds).map(id => ctx.db.get(id))
      );
      const chefMap = new Map<Id<'chefs'>, ChefDoc>();
      for (const chef of chefs) {
        if (chef) {
          chefMap.set(chef._id, chef as ChefDoc);
        }
      }
      
      // Build meals with chef data for preference filtering
      const mealsWithChefData = allMeals.map((meal: MealDoc) => {
        const chef = chefMap.get(meal.chefId);
        
        // Calculate delivery time if user location and chef location are available
        let deliveryTime: string | null = null;
        if (args.latitude && args.longitude && chef) {
          const chefLocation = (chef as any).location;
          if (chefLocation?.coordinates && Array.isArray(chefLocation.coordinates) && chefLocation.coordinates.length === 2) {
            const [chefLat, chefLng] = chefLocation.coordinates;
            const mealAny = meal as { prepTime?: string; prep_time?: string };
            // Parse prep time if available (format: "20 min" or "20")
            let prepTimeMinutes: number | null = null;
            if (mealAny.prepTime || mealAny.prep_time) {
              const prepTimeStr = mealAny.prepTime || mealAny.prep_time || '';
              const match = prepTimeStr.match(/(\d+)/);
              if (match) {
                prepTimeMinutes = parseInt(match[1], 10);
              }
            }
            try {
              deliveryTime = getFormattedDeliveryTime(
                chefLat,
                chefLng,
                args.latitude,
                args.longitude,
                prepTimeMinutes
              );
            } catch (error) {
              // If calculation fails, leave deliveryTime as null
              console.error('Error calculating delivery time:', error);
            }
          }
        }
        
        return {
          ...meal,
          chef: chef ? {
            _id: (chef as ChefDoc)._id,
            name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
            bio: (chef as ChefDoc).bio,
            specialties: (chef as ChefDoc).specialties || [],
            rating: (chef as ChefDoc).rating || 0,
            profileImage: (chef as ChefDoc).profileImage,
            verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
            verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
          } : {
            _id: meal.chefId,
            name: `Chef ${meal.chefId}`,
            bio: '',
            specialties: [],
            rating: 0,
            profileImage: null,
          },
          deliveryTime,
        };
      });
      
      // Apply user preference filtering if userId provided
      let meals = mealsWithChefData;
      if (args.userId) {
        try {
          const preferences = await getUserPreferences(ctx, args.userId);
          const scoredMeals = filterAndRankMealsByPreferences(
            mealsWithChefData,
            preferences,
            () => 0 // Base score doesn't matter for random selection
          );
          meals = scoredMeals.map((s: { meal: MealDoc }) => s.meal);
        } catch (error) {
          // If preference fetching fails, use all meals
          console.error('Error fetching user preferences:', error);
          meals = mealsWithChefData;
        }
      }
      
      // Shuffle array using Fisher-Yates algorithm
      const shuffled = [...meals];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Return selected meals (already have chef data)
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Error fetching random meals:', error);
      return [];
    }
  },
});

// Get popular meals (simple version without chef filter)
// This query exists to satisfy components that reference queries/meals:getPopular
export const getPopular = query({
  args: {
    userId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { userId?: Id<'users'>; limit?: number; sessionToken?: string }) => {
    const limit = args.limit || 20;
    
    try {
      // Get all available meals
      const allMeals = await ctx.db
        .query('meals')
        .filter((q) => {
          return q.or(
            q.eq(q.field('status'), 'available'),
            q.eq(q.field('status'), 'active')
          );
        })
        .collect();
      
      if (allMeals.length === 0) {
        return [];
      }
      
      // Get reviews for all meals to calculate popularity
      const mealsWithPopularity = await Promise.all(
        allMeals.map(async (meal: MealDoc) => {
          const reviews = await ctx.db
            .query('reviews')
            .filter((q) => q.eq(q.field('mealId'), meal._id))
            .collect();
          
          const reviewCount = reviews.length;
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0;
          
          // Popularity score: rating * log(reviewCount + 1)
          const popularityScore = averageRating * Math.log(reviewCount + 1);
          
          return {
            ...meal,
            reviewCount,
            averageRating,
            popularityScore,
          };
        })
      );
      
      // Apply user preference filtering if userId provided
      let results: Array<MealDoc & { reviewCount: number; averageRating: number; popularityScore: number }> = mealsWithPopularity;
      if (args.userId) {
        try {
          const preferences = await getUserPreferences(ctx, args.userId);
          const scoredMeals = filterAndRankMealsByPreferences(
            mealsWithPopularity,
            preferences,
            (meal: MealDoc & { popularityScore?: number }) => meal.popularityScore || 0
          );
          results = scoredMeals.map((s: { meal: MealDoc & { reviewCount: number; averageRating: number; popularityScore: number } }) => s.meal);
        } catch (error) {
          console.error('Error fetching user preferences:', error);
          results = mealsWithPopularity;
        }
      } else {
        // Sort by popularity score if no user preferences
        results.sort((a: MealDoc & { popularityScore?: number }, b: MealDoc & { popularityScore?: number }) => (b.popularityScore || 0) - (a.popularityScore || 0));
      }
      
      // Get chef data for selected meals
      const selectedMeals = results.slice(0, limit);
      const chefIds = new Set(selectedMeals.map((meal: MealDoc) => meal.chefId));
      const chefs = await Promise.all(
        Array.from(chefIds).map(id => ctx.db.get(id))
      );
      const chefMap = new Map<Id<'chefs'>, ChefDoc>();
      for (const chef of chefs) {
        if (chef) {
          chefMap.set(chef._id, chef as ChefDoc);
        }
      }
      
      // Build meals with chef data
      return selectedMeals.map((meal: MealDoc) => {
        const chef = chefMap.get(meal.chefId);
        return {
          ...meal,
          chef: chef ? {
            _id: (chef as ChefDoc)._id,
            name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
            bio: (chef as ChefDoc).bio,
            specialties: (chef as ChefDoc).specialties || [],
            rating: (chef as ChefDoc).rating || 0,
            profileImage: (chef as ChefDoc).profileImage,
            verificationStatus: (chef as { verificationStatus?: string }).verificationStatus,
            verificationDocuments: (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments,
          } : {
            _id: meal.chefId,
            name: `Chef ${meal.chefId}`,
            bio: '',
            specialties: [],
            rating: 0,
            profileImage: null,
          },
        };
      });
    } catch (error) {
      console.error('Error fetching popular meals:', error);
      return [];
    }
  },
});

// Public query to get a meal by ID (for editing)
export const getMealByIdForEdit = query({
  args: {
    mealId: v.id('meals'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args: { 
    mealId: Id<'meals'>;
    sessionToken?: string;
  }) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const meal = await ctx.db.get(args.mealId);
    if (!meal) {
      throw new Error('Meal not found');
    }
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(meal.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only view meals for their own chef profile, staff/admin can view any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return meal;
  },
});

// Internal query to get a meal by ID
export const getMealById = internalQuery({
  args: {
    mealId: v.id('meals'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mealId);
  },
});

// Internal query to get meals without embeddings
export const getMealsWithoutEmbeddings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allMeals = await ctx.db
      .query('meals')
      .filter((q) => q.eq(q.field('status'), 'available'))
      .collect();
    
    // Filter meals that don't have embeddings
    return allMeals.filter((meal: { embedding?: number[] }) => !meal.embedding || meal.embedding.length === 0);
  },
}); 