import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
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
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const offset = args.offset || 0;
    
    const meals = await ctx.db
      .query('meals')
      .filter(q => q.eq(q.field('chefId'), args.chefId))
      .collect();
    
    return meals.slice(offset, offset + limit);
  },
});

// Search meals with filters
export const searchMeals = query({
  args: {
    query: v.string(),
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

      return mealsWithChefData;
    } catch (error) {
      console.error('Error searching meals:', error);
      return [];
    }
  }
});

// Get search suggestions
export const getSearchSuggestions = query({
  args: { query: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    try {
      if (args.query.length < 2) return [];
      
      const meals = await ctx.db.query('meals').collect();
      const searchTerm = args.query.toLowerCase();
      
      // Get meal names and cuisines that match
      const suggestions = new Set<string>();
      
      meals.forEach(meal => {
        if (meal.name.toLowerCase().includes(searchTerm)) {
          suggestions.add(meal.name);
        }
        meal.cuisine.forEach(cuisine => {
          if (cuisine.toLowerCase().includes(searchTerm)) {
            suggestions.add(cuisine);
          }
        });
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
  args: { userId: v.id('users') },
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
      
      return previousMeals
        .filter(meal => meal !== null)
        .sort((a, b) => ((b as any)?.rating || 0) - ((a as any)?.rating || 0));
    } catch (error) {
      console.error('Error fetching previous meals:', error);
      return [];
    }
  }
}); 