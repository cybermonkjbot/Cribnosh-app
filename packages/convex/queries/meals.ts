import { v } from 'convex/values';
import { query } from '../_generated/server';
import { filterAndRankMealsByPreferences, getUserPreferences } from '../utils/userPreferencesFilter';

export const getAll = query({
  args: {
    userId: v.optional(v.id('users')),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const meals = await ctx.db.query('meals').collect();
    
    // Get chef information for each meal
    const mealsWithChefData = await Promise.all(
      meals.map(async (meal) => {
        const chef = await ctx.db.get(meal.chefId);
        const reviews = await ctx.db
          .query('reviews')
          .filter((q: any) => q.eq(q.field('mealId'), meal._id))
          .collect();
        
        return {
          ...meal,
          chef: chef ? {
            _id: chef._id,
            name: chef.name || `Chef ${chef._id}`,
            bio: chef.bio,
            specialties: chef.specialties || [],
            rating: chef.rating || 0,
            profileImage: chef.profileImage
          } : {
            _id: meal.chefId,
            name: `Chef ${meal.chefId}`,
            bio: '',
            specialties: [],
            rating: 0,
            profileImage: null
          },
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      })
    );

    // Apply user preference filtering if userId provided
    if (args.userId) {
      try {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          mealsWithChefData,
          preferences,
          (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
        );
        return scoredMeals.map(s => s.meal);
      } catch (error) {
        // If preference fetching fails, return unfiltered meals
        console.error('Error fetching user preferences:', error);
        return mealsWithChefData;
      }
    }

    return mealsWithChefData;
  },
});

export const getPending = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query('meals').filter(q => q.eq(q.field('status'), 'pending')).collect();
  },
});

export const get = query({
  args: { mealId: v.id('meals') },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mealId);
  },
});

export const getById = query({
  args: { mealId: v.id('meals') },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const offset = args.offset || 0;
    
    let meals = await ctx.db
      .query('meals')
      .filter(q => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Apply filters
    if (args.category) {
      meals = meals.filter(meal => 
        meal.category?.toLowerCase() === args.category!.toLowerCase() ||
        meal.cuisine?.some((c: string) => c.toLowerCase() === args.category!.toLowerCase())
      );
    }
    
    if (args.dietary && args.dietary.length > 0) {
      meals = meals.filter(meal => 
        args.dietary!.some(diet => 
          meal.dietaryInfo?.vegetarian && diet === 'vegetarian' ||
          meal.dietaryInfo?.vegan && diet === 'vegan' ||
          meal.dietaryInfo?.glutenFree && diet === 'gluten-free' ||
          meal.allergens?.some((a: string) => a.toLowerCase() === diet.toLowerCase())
        )
      );
    }
    
    // Filter by status (only available meals)
    meals = meals.filter(meal => meal.status === 'available' || meal.status === 'active');
    
    // Get reviews for rating calculation
    const mealsWithReviews = await Promise.all(
      meals.map(async (meal) => {
        const reviews = await ctx.db
          .query('reviews')
          .filter((q: any) => q.eq(q.field('mealId'), meal._id))
          .collect();
        
        return {
          ...meal,
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      })
    );
    
    // Apply user preference filtering if userId provided
    let results = mealsWithReviews;
    if (args.userId) {
      const preferences = await getUserPreferences(ctx, args.userId);
      const scoredMeals = filterAndRankMealsByPreferences(
        mealsWithReviews,
        preferences,
        (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
      );
      results = scoredMeals.map(s => s.meal);
    }
    
    return results.slice(offset, offset + limit);
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
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    let meals = await ctx.db
      .query('meals')
      .filter(q => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Filter by status (only available meals)
    meals = meals.filter(meal => meal.status === 'available' || meal.status === 'active');
    
    // Get reviews and calculate popularity score
    const mealsWithPopularity = await Promise.all(
      meals.map(async (meal) => {
        const reviews = await ctx.db
          .query('reviews')
          .filter((q: any) => q.eq(q.field('mealId'), meal._id))
          .collect();
        
        const reviewCount = reviews.length;
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
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
    let results = mealsWithPopularity;
    if (args.userId) {
      try {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          mealsWithPopularity,
          preferences,
          (meal) => meal.popularityScore
        );
        results = scoredMeals.map(s => s.meal);
      } catch (error) {
        // If preference fetching fails, return unfiltered meals
        console.error('Error fetching user preferences:', error);
        results = mealsWithPopularity;
      }
    } else {
      // Sort by popularity score if no user preferences
      results.sort((a, b) => b.popularityScore - a.popularityScore);
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
  handler: async (ctx, args) => {
    const meals = await ctx.db
      .query('meals')
      .filter(q => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Filter by status (only available meals)
    const availableMeals = meals.filter(meal => meal.status === 'available' || meal.status === 'active');
    
    // Aggregate by category
    const categoryMap = new Map<string, number>();
    
    availableMeals.forEach(meal => {
      // Use category if exists, otherwise use first cuisine type
      const category = meal.category || meal.cuisine?.[0] || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);
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
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let meals = await ctx.db
      .query('meals')
      .filter(q => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    // Filter by status (only available meals)
    meals = meals.filter(meal => meal.status === 'available' || meal.status === 'active');
    
    // Filter by search query
    if (args.query) {
      const searchTerm = args.query.toLowerCase();
      meals = meals.filter(meal => 
        meal.name?.toLowerCase().includes(searchTerm) ||
        meal.description?.toLowerCase().includes(searchTerm) ||
        meal.cuisine?.some((c: string) => c.toLowerCase().includes(searchTerm)) ||
        meal.ingredients?.some((i: string) => i.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply category filter
    if (args.category) {
      meals = meals.filter(meal => 
        meal.category?.toLowerCase() === args.category!.toLowerCase() ||
        meal.cuisine?.some((c: string) => c.toLowerCase() === args.category!.toLowerCase())
      );
    }
    
    // Apply dietary filter
    if (args.dietary && args.dietary.length > 0) {
      meals = meals.filter(meal => 
        args.dietary!.some(diet => 
          meal.dietaryInfo?.vegetarian && diet === 'vegetarian' ||
          meal.dietaryInfo?.vegan && diet === 'vegan' ||
          meal.dietaryInfo?.glutenFree && diet === 'gluten-free' ||
          meal.allergens?.some((a: string) => a.toLowerCase() === diet.toLowerCase())
        )
      );
    }
    
    // Get reviews for rating
    const mealsWithReviews = await Promise.all(
      meals.map(async (meal) => {
        const reviews = await ctx.db
          .query('reviews')
          .filter((q: any) => q.eq(q.field('mealId'), meal._id))
          .collect();
        
        return {
          ...meal,
          reviewCount: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
            : meal.rating || 0
        };
      })
    );
    
    // Apply user preference filtering if userId provided
    let results = mealsWithReviews;
    if (args.userId) {
      const preferences = await getUserPreferences(ctx, args.userId);
      const scoredMeals = filterAndRankMealsByPreferences(
        mealsWithReviews,
        preferences,
        (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
      );
      results = scoredMeals.map(s => s.meal);
    } else {
      // Sort by rating if no user preferences
      results.sort((a, b) => b.averageRating - a.averageRating);
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
  handler: async (ctx, args) => {
    try {
      let meals = await ctx.db.query('meals').collect();
      
      // Filter by search query
      if (args.query) {
        const searchTerm = args.query.toLowerCase();
        meals = meals.filter(meal => 
          meal.name.toLowerCase().includes(searchTerm) ||
          meal.description.toLowerCase().includes(searchTerm) ||
          meal.cuisine.some(c => c.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply additional filters
      if (args.filters) {
        if (args.filters.cuisine) {
          meals = meals.filter(meal => 
            meal.cuisine.some(c => c.toLowerCase() === args.filters!.cuisine!.toLowerCase())
          );
        }
        
        if (args.filters.priceRange) {
          const { min, max } = args.filters.priceRange;
          meals = meals.filter(meal => {
            if (min !== undefined && meal.price < min) return false;
            if (max !== undefined && meal.price > max) return false;
            return true;
          });
        }
        
        if (args.filters.dietary && args.filters.dietary.length > 0) {
          meals = meals.filter(meal => 
            args.filters!.dietary!.some(diet => 
              meal.dietary.includes(diet)
            )
          );
        }
      }
      
      // Sort by rating and limit results
      const filteredMeals = meals
        .filter(meal => meal.status === 'available')
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 20);

      // Get chef information for each meal
      const mealsWithChefData = await Promise.all(
        filteredMeals.map(async (meal) => {
          const chef = await ctx.db.get(meal.chefId);
          const reviews = await ctx.db
            .query('reviews')
            .filter((q: any) => q.eq(q.field('mealId'), meal._id))
            .collect();
          
          return {
            ...meal,
            chef: chef ? {
              _id: chef._id,
              name: chef.name || `Chef ${chef._id}`,
              bio: chef.bio,
              specialties: chef.specialties || [],
              rating: chef.rating || 0,
              profileImage: chef.profileImage
            } : {
              _id: meal.chefId,
              name: `Chef ${meal.chefId}`,
              bio: '',
              specialties: [],
              rating: 0,
              profileImage: null
            },
            reviewCount: reviews.length,
            averageRating: reviews.length > 0 
              ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
              : meal.rating || 0
          };
        })
      );

      let results = mealsWithChefData;

      // Apply user preference filtering if userId provided
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
  handler: async (ctx, args) => {
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
            allMeals.map((meal: any) => ({ ...meal })),
            preferences,
            () => 0 // Base score doesn't matter for suggestions
          );
          meals = scoredMeals.map(s => s.meal);
        } catch (error) {
          // If preference fetching fails, use all meals
          console.error('Error fetching user preferences:', error);
          meals = allMeals;
        }
      }
      
      const searchTerm = args.query.toLowerCase();
      
      // Get meal names and cuisines that match
      const suggestions = new Set<string>();
      
      meals.forEach((meal: any) => {
        if (meal.name && meal.name.toLowerCase().includes(searchTerm)) {
          suggestions.add(meal.name);
        }
        if (meal.cuisine && Array.isArray(meal.cuisine)) {
          meal.cuisine.forEach((cuisine: string) => {
            if (cuisine.toLowerCase().includes(searchTerm)) {
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

// Get user's previous meals
export const getPreviousMeals = query({
  args: { 
    userId: v.id('users'),
    applyPreferences: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    try {
      // Get user's order history
      const orders = await ctx.db
        .query('orders')
        .filter(q => q.eq(q.field('customer_id'), args.userId))
        .collect();
      
      // Extract meal IDs from orders
      const mealIds = new Set<string>();
      orders.forEach(order => {
        order.order_items.forEach((item: any) => {
          mealIds.add(item.dish_id);
        });
      });
      
      // Get meal details
      const previousMeals = await Promise.all(
        Array.from(mealIds).map(async (mealId) => {
          return await ctx.db.get(mealId as any);
        })
      );
      
      let results = previousMeals
        .filter(meal => meal !== null)
        .sort((a, b) => ((b as any)?.rating || 0) - ((a as any)?.rating || 0));

      // Apply user preference filtering if requested
      if (args.applyPreferences !== false) {
        const preferences = await getUserPreferences(ctx, args.userId);
        const scoredMeals = filterAndRankMealsByPreferences(
          results,
          preferences,
          (meal) => ((meal as any)?.rating || 0) * 10
        );
        results = scoredMeals.map(s => s.meal);
      }

      return results;
    } catch (error) {
      console.error('Error fetching previous meals:', error);
      return [];
    }
  }
}); 