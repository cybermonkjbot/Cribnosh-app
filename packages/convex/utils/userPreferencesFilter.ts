import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';

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
export interface MealRelevanceScore {
  meal: any;
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
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();

  // Fetch dietary preferences
  const dietaryPrefs = await ctx.db
    .query('dietaryPreferences')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();

  // Fetch followed chefs
  const followedChefs = await ctx.db
    .query('userFollows')
    .withIndex('by_follower', (q) => q.eq('followerId', userId))
    .collect();

  // Fetch liked meals (favorites)
  const likedMeals = await ctx.db
    .query('userFavorites')
    .withIndex('by_user_type', (q) => 
      q.eq('userId', userId).eq('favoriteType', 'meal')
    )
    .collect();

  return {
    allergies: allergies.map(a => ({
      name: a.name.toLowerCase(),
      type: a.type,
      severity: a.severity,
    })),
    dietaryPreferences: dietaryPrefs?.preferences || [],
    religiousRequirements: dietaryPrefs?.religious_requirements || [],
    healthDriven: dietaryPrefs?.health_driven || [],
    followedChefIds: new Set(followedChefs.map(f => f.followingId as string)),
    likedMealIds: new Set(likedMeals.map(f => f.favoriteId as string)),
  };
}

/**
 * Check if a meal should be excluded based on user allergies
 */
function hasAllergen(meal: any, userAllergies: Array<{ name: string; severity: string }>): boolean {
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
function matchesDietaryPreferences(meal: any, preferences: string[]): boolean {
  if (preferences.length === 0) return true;

  const mealDietary = meal.dietary || [];
  const mealDietaryLower = mealDietary.map((d: string) => d.toLowerCase());
  
  // Check if meal has any of the user's dietary preferences
  return preferences.some(pref => {
    const prefLower = pref.toLowerCase();
    return mealDietaryLower.some((d: string) => 
      d.includes(prefLower) || prefLower.includes(d) || d === prefLower
    );
  });
}

/**
 * Check if meal matches religious requirements
 */
function matchesReligiousRequirements(meal: any, requirements: string[]): boolean {
  if (requirements.length === 0) return true;

  const mealDietary = meal.dietary || [];
  const mealDietaryLower = mealDietary.map((d: string) => d.toLowerCase());
  
  // Check if meal matches religious requirements (halal, kosher, etc.)
  return requirements.some(req => {
    const reqLower = req.toLowerCase();
    return mealDietaryLower.includes(reqLower);
  });
}

/**
 * Check if meal matches health-driven preferences
 */
function matchesHealthPreferences(meal: any, healthPrefs: string[]): boolean {
  if (healthPrefs.length === 0) return true;

  const mealDietary = meal.dietary || [];
  const mealDietaryLower = mealDietary.map((d: string) => d.toLowerCase());
  
  // Check if meal matches health preferences
  return healthPrefs.some(health => {
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
  meal: any,
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
  meal: any,
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
export function filterMealsByPreferences(
  meals: any[],
  preferences: UserPreferences
): any[] {
  return meals.filter(meal => shouldIncludeMeal(meal, preferences));
}

/**
 * Filter and rank meals by user preferences
 */
export function filterAndRankMealsByPreferences(
  meals: any[],
  preferences: UserPreferences,
  baseScoreFn?: (meal: any) => number
): MealRelevanceScore[] {
  const scoredMeals: MealRelevanceScore[] = meals.map(meal => {
    const baseScore = baseScoreFn ? baseScoreFn(meal) : (meal.rating || 0) * 10;
    return getMealRelevanceScore(meal, preferences, baseScore);
  });

  // Filter out meals with allergens (score < -500)
  const filtered = scoredMeals.filter(s => s.score >= -500);

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);

  return filtered;
}

