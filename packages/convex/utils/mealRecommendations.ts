import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { filterAndRankMealsByPreferences, getUserPreferences, type UserPreferences } from './userPreferencesFilter';

// Common database context type
type DatabaseCtx = QueryCtx | MutationCtx;

/**
 * Get personalized meals for a user
 */
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

export async function getPersonalizedMeals(
  ctx: DatabaseCtx,
  userId: Id<'users'>,
  limit: number = 20
): Promise<unknown[]> {
  const preferences = await getUserPreferences(ctx, userId);
  
  // Get all available meals
  const allMeals = await ctx.db
    .query('meals')
    .filter((q) => q.eq(q.field('status'), 'available'))
    .collect();

  // Get chef information and reviews for each meal
  const mealsWithChefData = await Promise.all(
    allMeals.map(async (meal: MealDoc) => {
      const chef = await ctx.db.get(meal.chefId);
      const reviews = await ctx.db
        .query('reviews')
        .filter((q) => q.eq(q.field('mealId'), meal._id))
        .collect();

      return {
        ...meal,
        chef: chef ? {
          _id: (chef as ChefDoc)._id,
          name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
          bio: (chef as ChefDoc).bio,
          specialties: (chef as ChefDoc).specialties || [],
          rating: (chef as ChefDoc).rating || 0,
          profileImage: (chef as ChefDoc).profileImage
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
          ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
          : meal.rating || 0
      };
    })
  );

  // Filter and rank by preferences
  const scoredMeals = filterAndRankMealsByPreferences(
    mealsWithChefData,
    preferences,
    (meal: MealDoc & { averageRating?: number; reviewCount?: number }) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0)
  );

  return scoredMeals.slice(0, limit).map((s: { meal: unknown }) => s.meal);
}

/**
 * Get recommended meals based on preferences, likes, and follows
 */
export async function getRecommendedMeals(
  ctx: DatabaseCtx,
  userId: Id<'users'>,
  limit: number = 10
): Promise<unknown[]> {
  const preferences = await getUserPreferences(ctx, userId);
  
  // Get meals from followed chefs first
  const followedChefMeals = await Promise.all(
    Array.from(preferences.followedChefIds).map(async (chefId: string) => {
      const meals = await ctx.db
        .query('meals')
        .filter((q) => q.eq(q.field('chefId'), chefId as Id<'chefs'>))
        .filter((q) => q.eq(q.field('status'), 'available'))
        .collect();
      return meals;
    })
  );

  // Get liked meals
  const likedMeals = await Promise.all(
    Array.from(preferences.likedMealIds).map(async (mealId: string) => {
      return await ctx.db.get(mealId as Id<'meals'>);
    })
  );

  // Combine and filter
  const allMeals = [
    ...followedChefMeals.flat(),
    ...likedMeals.filter((m: MealDoc | null) => m && (m as { status?: string }).status === 'available')
  ];

  // Remove duplicates
  const uniqueMeals = Array.from(
    new Map(allMeals.map((meal: MealDoc) => [meal._id, meal])).values()
  );

  // Get chef and review data
  const mealsWithChefData = await Promise.all(
    uniqueMeals.map(async (meal: MealDoc) => {
      const chef = await ctx.db.get(meal.chefId);
      const reviews = await ctx.db
        .query('reviews')
        .filter((q) => q.eq(q.field('mealId'), meal._id))
        .collect();

      return {
        ...meal,
        chef: chef ? {
          _id: (chef as ChefDoc)._id,
          name: (chef as ChefDoc).name || `Chef ${(chef as ChefDoc)._id}`,
          bio: (chef as ChefDoc).bio,
          specialties: (chef as ChefDoc).specialties || [],
          rating: (chef as ChefDoc).rating || 0,
          profileImage: (chef as ChefDoc).profileImage
        } : null,
        reviewCount: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum: number, review: ReviewDoc) => sum + (review.rating || 0), 0) / reviews.length
          : meal.rating || 0
      };
    })
  );

  // Filter and rank by preferences
  const scoredMeals = filterAndRankMealsByPreferences(
    mealsWithChefData,
    preferences,
    (meal: MealDoc & { averageRating?: number; reviewCount?: number; chefId?: string | Id<'chefs'>; _id?: string | Id<'meals'> }) => (meal.averageRating || 0) * 10 + (meal.reviewCount || 0) + 
      (preferences.followedChefIds.has((meal.chefId || (meal as { chefId?: string | Id<'chefs'> }).chefId) as string) ? 50 : 0) +
      (preferences.likedMealIds.has((meal._id || (meal as { _id?: string | Id<'meals'> })._id) as string) ? 60 : 0)
  );

  return scoredMeals.slice(0, limit).map((s: { meal: unknown }) => s.meal);
}

/**
 * Get similar meals that respect preferences
 */
export async function getSimilarMeals(
  ctx: DatabaseCtx,
  mealId: Id<'meals'>,
  userId: Id<'users'> | null,
  limit: number = 5
): Promise<unknown[]> {
  const baseMeal = await ctx.db.get(mealId);
  if (!baseMeal) {
    return [];
  }

  // Get user preferences if userId provided
  let preferences: UserPreferences | null = null;
  if (userId) {
    preferences = await getUserPreferences(ctx, userId);
  }

  // Find similar meals (same cuisine, similar dietary tags)
  const allMeals = await ctx.db
    .query('meals')
    .filter((q) => q.eq(q.field('status'), 'available'))
    .collect();

  const similarMeals = allMeals
    .filter((meal: MealDoc) => meal._id !== mealId)
    .map((meal: MealDoc) => {
      let similarityScore = 0;
      const baseMealAny = baseMeal as { cuisine?: string[]; dietary?: string[]; [key: string]: unknown };
      const mealAny = meal as { cuisine?: string[]; dietary?: string[]; [key: string]: unknown };

      // Cuisine similarity
      if (baseMealAny.cuisine && mealAny.cuisine && Array.isArray(baseMealAny.cuisine) && Array.isArray(mealAny.cuisine)) {
        const baseCuisines = baseMealAny.cuisine.map((c: string) => c.toLowerCase());
        const mealCuisines = mealAny.cuisine.map((c: string) => c.toLowerCase());
        const commonCuisines = baseCuisines.filter((c: string) => mealCuisines.includes(c));
        similarityScore += commonCuisines.length * 10;
      }

      // Dietary tags similarity
      if (baseMealAny.dietary && mealAny.dietary && Array.isArray(baseMealAny.dietary) && Array.isArray(mealAny.dietary)) {
        const baseDietary = baseMealAny.dietary.map((d: string) => d.toLowerCase());
        const mealDietary = mealAny.dietary.map((d: string) => d.toLowerCase());
        const commonDietary = baseDietary.filter((d: string) => mealDietary.includes(d));
        similarityScore += commonDietary.length * 5;
      }

      return { meal, similarityScore };
    })
    .filter((item: { meal: MealDoc; similarityScore: number }) => item.similarityScore > 0)
    .sort((a: { meal: MealDoc; similarityScore: number }, b: { meal: MealDoc; similarityScore: number }) => b.similarityScore - a.similarityScore);

  // Apply user preference filtering if userId provided
  if (preferences) {
    const scoredMeals = filterAndRankMealsByPreferences(
      similarMeals.map((item: { meal: MealDoc; similarityScore: number }) => item.meal),
      preferences,
      (meal: MealDoc) => {
        const item = similarMeals.find((sm: { meal: MealDoc; similarityScore: number }) => sm.meal._id === meal._id);
        return (item?.similarityScore || 0) * 10;
      }
    );
    return scoredMeals.slice(0, limit).map((s: { meal: unknown }) => s.meal);
  }

  return similarMeals.slice(0, limit).map((item: { meal: MealDoc; similarityScore: number }) => item.meal);
}

/**
 * Rank meals by relevance using preference scores
 */
export function rankMealsByRelevance<T extends { rating?: number; reviewCount?: number; [key: string]: unknown }>(
  meals: T[],
  preferences: UserPreferences
): Array<{ meal: T; score: number; reasons: string[] }> {
  const { filterAndRankMealsByPreferences } = require('./userPreferencesFilter');
  return filterAndRankMealsByPreferences(
    meals,
    preferences,
    (meal: T) => ((meal as { rating?: number }).rating || 0) * 10 + ((meal as { reviewCount?: number }).reviewCount || 0)
  );
}

