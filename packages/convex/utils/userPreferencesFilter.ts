import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

// Helper type for index query builder to work around Convex type inference limitations
type IndexQueryBuilder = {
  eq: (field: string, value: unknown) => IndexQueryBuilder | unknown;
};

// Helper function to safely access index query builder
function getIndexQueryBuilder(q: unknown): IndexQueryBuilder {
  return q as unknown as IndexQueryBuilder;
}

// Common database context type that works for both queries and mutations
type DatabaseCtx = QueryCtx | MutationCtx;

// User preferences interface
export interface UserPreferences {
  allergies: Array<{
    name: string;
    type: 'allergy' | 'intolerance';
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  dietaryPreferences: string[];
  religiousRequirements: string[];
  healthDriven: string[];
  followedChefIds: Set<string>;
  likedMealIds: Set<string>;
}

// Meal relevance score interface
export interface MealRelevanceScore<T = unknown> {
  meal: T;
  score: number;
  reasons: string[];
}

/**
 * Fetch all user preferences (dietary, allergies, likes, follows)
 */
export async function getUserPreferences(
  ctx: DatabaseCtx,
  userId: Id<'users'>
): Promise<UserPreferences> {
  // Fetch allergies
  const allergies = await ctx.db
    .query('allergies')
    // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
    .withIndex('by_user', (q: unknown) => {
      return getIndexQueryBuilder(q).eq('userId', userId);
    })
    .collect();

  // Fetch dietary preferences
  const dietaryPrefs = await ctx.db
    .query('dietaryPreferences')
    // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
    .withIndex('by_user', (q: unknown) => {
      return getIndexQueryBuilder(q).eq('userId', userId);
    })
    .first();

  // Fetch followed chefs
  const followedChefs = await ctx.db
    .query('userFollows')
    // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
    .withIndex('by_follower', (q: unknown) => {
      return getIndexQueryBuilder(q).eq('followerId', userId);
    })
    .collect();

  // Fetch liked meals (favorites)
  const likedMeals = await ctx.db
    .query('userFavorites')
    // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
    .withIndex('by_user_type', (q: unknown) => {
      const builder = getIndexQueryBuilder(q);
      const first = builder.eq('userId', userId) as IndexQueryBuilder;
      return first.eq('favoriteType', 'meal');
    })
    .collect();

  return {
    allergies: allergies.map((a: { name: string; type: 'allergy' | 'intolerance'; severity: 'mild' | 'moderate' | 'severe' }) => ({
      name: a.name.toLowerCase(),
      type: a.type as 'allergy' | 'intolerance',
      severity: a.severity as 'mild' | 'moderate' | 'severe',
    })),
    dietaryPreferences: (dietaryPrefs as { preferences?: string[] } | null)?.preferences || [],
    religiousRequirements: (dietaryPrefs as { religious_requirements?: string[] } | null)?.religious_requirements || [],
    healthDriven: (dietaryPrefs as { health_driven?: string[] } | null)?.health_driven || [],
    followedChefIds: new Set(followedChefs.map((f: { followingId: string | Id<'chefs'> }) => f.followingId as string)),
    likedMealIds: new Set(likedMeals.map((f: { favoriteId: string | Id<'meals'> }) => f.favoriteId as string)),
  };
}

/**
 * Check if a meal should be excluded based on user allergies
 */
function hasAllergen(meal: { allergens?: string[]; [key: string]: unknown }, userAllergies: Array<{ name: string; severity: string }>): boolean {
  if (!meal.allergens || !Array.isArray(meal.allergens)) {
    return false;
  }

  const mealAllergens = meal.allergens.map((a: string) => a.toLowerCase());
  
  for (const allergy of userAllergies) {
    const allergyName = allergy.name.toLowerCase();
    
    // Check exact match
    if (mealAllergens.includes(allergyName)) {
      return true;
    }
    
    // Check partial match (e.g., "nuts" matches "tree nuts", "peanuts")
    if (mealAllergens.some((allergen: string) => 
      allergen.includes(allergyName) || allergyName.includes(allergen)
    )) {
      return true;
    }
  }

  return false;
}

/**
 * Check if meal matches dietary preferences
 */
function matchesDietaryPreferences(meal: { dietary?: string[]; [key: string]: unknown }, preferences: string[]): boolean {
  if (preferences.length === 0) return true;

  const mealDietary = meal.dietary || [];
  const mealDietaryLower = mealDietary.map((d: string) => d.toLowerCase());
  
  // Check if meal has any of the user's dietary preferences
  return preferences.some((pref: string) => {
    const prefLower = pref.toLowerCase();
    return mealDietaryLower.some((d: string) => 
      d.includes(prefLower) || prefLower.includes(d) || d === prefLower
    );
  });
}

/**
 * Check if meal matches religious requirements
 */
function matchesReligiousRequirements(meal: { dietary?: string[]; [key: string]: unknown }, requirements: string[]): boolean {
  if (requirements.length === 0) return true;

  const mealDietary = meal.dietary || [];
  const mealDietaryLower = mealDietary.map((d: string) => d.toLowerCase());
  
  // Check if meal matches religious requirements (halal, kosher, etc.)
  return requirements.some((req: string) => {
    const reqLower = req.toLowerCase();
    return mealDietaryLower.includes(reqLower);
  });
}

/**
 * Check if meal matches health-driven preferences
 */
function matchesHealthPreferences(meal: { dietary?: string[]; [key: string]: unknown }, healthPrefs: string[]): boolean {
  if (healthPrefs.length === 0) return true;

  const mealDietary = meal.dietary || [];
  const mealDietaryLower = mealDietary.map((d: string) => d.toLowerCase());
  
  // Check if meal matches health preferences
  return healthPrefs.some((health: string) => {
    const healthLower = health.toLowerCase();
    return mealDietaryLower.some((d: string) => 
      d.includes(healthLower) || healthLower.includes(d)
    );
  });
}

/**
 * Check if a meal should be included based on user preferences
 */
export function shouldIncludeMeal(
  meal: { allergens?: string[]; dietary?: string[]; [key: string]: unknown },
  preferences: UserPreferences
): boolean {
  // STRICT EXCLUSION: Check allergies first (most important)
  if (hasAllergen(meal, preferences.allergies)) {
    return false;
  }

  // If user has religious requirements, meal must match
  if (preferences.religiousRequirements.length > 0) {
    if (!matchesReligiousRequirements(meal, preferences.religiousRequirements)) {
      return false;
    }
  }

  // All other checks passed
  return true;
}

/**
 * Calculate relevance score for a meal based on user preferences
 */
export function getMealRelevanceScore(
  meal: { allergens?: string[]; dietary?: string[]; chefId?: string | Id<'chefs'>; chef?: { _id?: string | Id<'chefs'> }; _id?: string | Id<'meals'>; id?: string; [key: string]: unknown },
  preferences: UserPreferences,
  baseScore: number = 0
): MealRelevanceScore {
  let score = baseScore;
  const reasons: string[] = [];

  // Check if meal has allergens (should be excluded, but score is for ranking)
  if (hasAllergen(meal, preferences.allergies)) {
    score -= 1000; // Heavy penalty
    reasons.push('Contains allergens');
    return { meal, score, reasons };
  }

  // Dietary preference match: +50
  if (matchesDietaryPreferences(meal, preferences.dietaryPreferences)) {
    score += 50;
    reasons.push('Matches dietary preferences');
  }

  // Religious requirement match: +30
  if (matchesReligiousRequirements(meal, preferences.religiousRequirements)) {
    score += 30;
    reasons.push('Matches religious requirements');
  }

  // Health preference match: +20
  if (matchesHealthPreferences(meal, preferences.healthDriven)) {
    score += 20;
    reasons.push('Matches health preferences');
  }

  // Followed chef: +40
  const mealChefId = meal.chefId || meal.chef?._id;
  if (mealChefId && preferences.followedChefIds.has(mealChefId as string)) {
    score += 40;
    reasons.push('From followed chef');
  }

  // Liked meal: +60
  const mealId = meal._id || meal.id;
  if (mealId && preferences.likedMealIds.has(mealId as string)) {
    score += 60;
    reasons.push('Previously liked');
  }

  return { meal, score, reasons };
}

/**
 * Filter meals based on user preferences
 */
export function filterMealsByPreferences<T extends { allergens?: string[]; dietary?: string[]; [key: string]: unknown }>(
  meals: T[],
  preferences: UserPreferences
): T[] {
  return meals.filter((meal: T) => shouldIncludeMeal(meal, preferences));
}

/**
 * Filter and rank meals by user preferences
 */
export function filterAndRankMealsByPreferences<T extends { allergens?: string[]; dietary?: string[]; rating?: number; [key: string]: unknown }>(
  meals: T[],
  preferences: UserPreferences,
  baseScoreFn?: (meal: T) => number
): MealRelevanceScore<T>[] {
  const scoredMeals: MealRelevanceScore<T>[] = meals.map((meal: T) => {
    const baseScore = baseScoreFn ? baseScoreFn(meal) : ((meal as { rating?: number }).rating || 0) * 10;
    return getMealRelevanceScore(meal, preferences, baseScore) as MealRelevanceScore<T>;
  });

  // Filter out meals with allergens (score < -500)
  const filtered = scoredMeals.filter((s: MealRelevanceScore<T>) => s.score >= -500);

  // Sort by score descending
  filtered.sort((a: MealRelevanceScore<T>, b: MealRelevanceScore<T>) => b.score - a.score);

  return filtered;
}

