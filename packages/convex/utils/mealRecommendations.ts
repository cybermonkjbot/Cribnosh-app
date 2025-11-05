import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { filterAndRankMealsByPreferences, getUserPreferences } from './userPreferencesFilter';

// Common database context type
type DatabaseCtx = QueryCtx | MutationCtx;

/**
 * Get personalized meals for a user
 */
export async function getPersonalizedMeals(
  ctx: DatabaseCtx,
  userId: Id<'users'>,
  limit: number = 20
): Promise<any[]> {
  const preferences = await getUserPreferences(ctx, userId);
  
  // Get all available meals
  const allMeals = await ctx.db
    .query('meals')
    .filter(q => q.eq(q.field('status'), 'available'))
    .collect();

  // Get chef information and reviews for each meal
  const mealsWithChefData = await Promise.all(
    allMeals.map(async (meal) => {
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

  // Filter and rank by preferences
  const scoredMeals = filterAndRankMealsByPreferences(
    mealsWithChefData,
    preferences,
    (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
  );

  return scoredMeals.slice(0, limit).map(s => s.meal);
}

/**
 * Get recommended meals based on preferences, likes, and follows
 */
export async function getRecommendedMeals(
  ctx: DatabaseCtx,
  userId: Id<'users'>,
  limit: number = 10
): Promise<any[]> {
  const preferences = await getUserPreferences(ctx, userId);
  
  // Get meals from followed chefs first
  const followedChefMeals = await Promise.all(
    Array.from(preferences.followedChefIds).map(async (chefId) => {
      const meals = await ctx.db
        .query('meals')
        .filter(q => q.eq(q.field('chefId'), chefId as any))
        .filter(q => q.eq(q.field('status'), 'available'))
        .collect();
      return meals;
    })
  );

  // Get liked meals
  const likedMeals = await Promise.all(
    Array.from(preferences.likedMealIds).map(async (mealId) => {
      return await ctx.db.get(mealId as any);
    })
  );

  // Combine and filter
  const allMeals = [
    ...followedChefMeals.flat(),
    ...likedMeals.filter(m => m && m.status === 'available')
  ];

  // Remove duplicates
  const uniqueMeals = Array.from(
    new Map(allMeals.map(meal => [meal._id, meal])).values()
  );

  // Get chef and review data
  const mealsWithChefData = await Promise.all(
    uniqueMeals.map(async (meal) => {
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
        } : null,
        reviewCount: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
          : meal.rating || 0
      };
    })
  );

  // Filter and rank by preferences
  const scoredMeals = filterAndRankMealsByPreferences(
    mealsWithChefData,
    preferences,
    (meal) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0) + 
      (preferences.followedChefIds.has(meal.chefId as string) ? 50 : 0) +
      (preferences.likedMealIds.has(meal._id as string) ? 60 : 0)
  );

  return scoredMeals.slice(0, limit).map(s => s.meal);
}

/**
 * Get similar meals that respect preferences
 */
export async function getSimilarMeals(
  ctx: DatabaseCtx,
  mealId: Id<'meals'>,
  userId: Id<'users'> | null,
  limit: number = 5
): Promise<any[]> {
  const baseMeal = await ctx.db.get(mealId);
  if (!baseMeal) {
    return [];
  }

  // Get user preferences if userId provided
  let preferences = null;
  if (userId) {
    preferences = await getUserPreferences(ctx, userId);
  }

  // Find similar meals (same cuisine, similar dietary tags)
  const allMeals = await ctx.db
    .query('meals')
    .filter(q => q.eq(q.field('status'), 'available'))
    .collect();

  const similarMeals = allMeals
    .filter(meal => meal._id !== mealId)
    .map(meal => {
      let similarityScore = 0;

      // Cuisine similarity
      if (baseMeal.cuisine && meal.cuisine) {
        const baseCuisines = baseMeal.cuisine.map((c: string) => c.toLowerCase());
        const mealCuisines = meal.cuisine.map((c: string) => c.toLowerCase());
        const commonCuisines = baseCuisines.filter(c => mealCuisines.includes(c));
        similarityScore += commonCuisines.length * 10;
      }

      // Dietary tags similarity
      if (baseMeal.dietary && meal.dietary) {
        const baseDietary = baseMeal.dietary.map((d: string) => d.toLowerCase());
        const mealDietary = meal.dietary.map((d: string) => d.toLowerCase());
        const commonDietary = baseDietary.filter(d => mealDietary.includes(d));
        similarityScore += commonDietary.length * 5;
      }

      return { meal, similarityScore };
    })
    .filter(item => item.similarityScore > 0)
    .sort((a, b) => b.similarityScore - a.similarityScore);

  // Apply user preference filtering if userId provided
  if (preferences) {
    const scoredMeals = filterAndRankMealsByPreferences(
      similarMeals.map(item => item.meal),
      preferences,
      (meal) => {
        const item = similarMeals.find(sm => sm.meal._id === meal._id);
        return (item?.similarityScore || 0) * 10;
      }
    );
    return scoredMeals.slice(0, limit).map(s => s.meal);
  }

  return similarMeals.slice(0, limit).map(item => item.meal);
}

/**
 * Rank meals by relevance using preference scores
 */
export function rankMealsByRelevance(
  meals: any[],
  preferences: any
): Array<{ meal: any; score: number; reasons: string[] }> {
  const { filterAndRankMealsByPreferences } = require('./userPreferencesFilter');
  return filterAndRankMealsByPreferences(
    meals,
    preferences,
    (meal) => (meal.rating || 0) * 10 + (meal.reviewCount || 0)
  );
}

