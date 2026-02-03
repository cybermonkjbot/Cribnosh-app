// @ts-nocheck
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
  likedChefIds: Set<string>;
  foodSafetySettings: {
    avoid_cross_contamination: boolean;
  };
}

// Taste profile extracted from liked meals
export interface TasteProfile {
  preferredCuisines: Map<string, number>; // cuisine -> count
  preferredDietaryTags: Map<string, number>; // dietary tag -> count
  preferredPriceRange?: { min: number; max: number };
  preferredChefIds: Set<string>;
  averagePrice?: number;
  likedMeals: Array<{ _id: Id<'meals'>; cuisine?: string[]; dietary?: string[]; price?: number; chefId?: Id<'chefs'>;[key: string]: unknown }>; // Store liked meals for individual similarity checks
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

  // Fetch liked chefs/kitchens (favorites)
  const likedChefs = await ctx.db
    .query('userFavorites')
    // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
    .withIndex('by_user_type', (q: unknown) => {
      const builder = getIndexQueryBuilder(q);
      const first = builder.eq('userId', userId) as IndexQueryBuilder;
      return first.eq('favoriteType', 'chef');
    })
    .collect();

  // Fetch food safety settings
  const foodSafety = await ctx.db
    .query('foodSafetySettings')
    // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
    .withIndex('by_user', (q: unknown) => {
      return getIndexQueryBuilder(q).eq('userId', userId);
    })
    .first();

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
    likedChefIds: new Set(likedChefs.map((f: { favoriteId: string | Id<'chefs'> }) => f.favoriteId as string)),
    foodSafetySettings: {
      avoid_cross_contamination: (foodSafety as { avoid_cross_contamination?: boolean } | null)?.avoid_cross_contamination || false,
    },
  };
}

/**
 * Check if a meal should be excluded based on user allergies
 */
function hasAllergen(meal: { allergens?: string[];[key: string]: unknown }, userAllergies: Array<{ name: string; severity: string }>): boolean {
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
function matchesDietaryPreferences(meal: { dietary?: string[];[key: string]: unknown }, preferences: string[]): boolean {
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
function matchesReligiousRequirements(meal: { dietary?: string[];[key: string]: unknown }, requirements: string[]): boolean {
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
function matchesHealthPreferences(meal: { dietary?: string[];[key: string]: unknown }, healthPrefs: string[]): boolean {
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
 * Check if chef follows proper cross-contamination protocols
 * A chef is considered safe if they are verified and have health permits
 */
function hasProperCrossContaminationProtocols(chef: { verificationStatus?: string; verificationDocuments?: { healthPermit?: boolean };[key: string]: unknown } | null | undefined): boolean {
  if (!chef) return false;

  // Chef must be verified
  const verificationStatus = (chef as { verificationStatus?: string }).verificationStatus;
  if (verificationStatus !== 'verified') {
    return false;
  }

  // Chef must have health permit
  const verificationDocuments = (chef as { verificationDocuments?: { healthPermit?: boolean } }).verificationDocuments;
  if (!verificationDocuments?.healthPermit) {
    return false;
  }

  return true;
}

/**
 * Extract taste profile from liked meals
 * Analyzes patterns in liked meals to understand user preferences
 */
export async function extractTasteProfile(
  ctx: DatabaseCtx,
  userId: Id<'users'>
): Promise<TasteProfile> {
  const preferences = await getUserPreferences(ctx, userId);

  if (preferences.likedMealIds.size === 0) {
    return {
      preferredCuisines: new Map(),
      preferredDietaryTags: new Map(),
      preferredChefIds: new Set(),
      likedMeals: [],
    };
  }

  // Fetch all liked meals
  const likedMeals = await Promise.all(
    Array.from(preferences.likedMealIds).map(async (mealId: string) => {
      return await ctx.db.get(mealId as Id<'meals'>);
    })
  );

  // Filter out null meals and analyze patterns
  const validLikedMeals: Array<{ _id: Id<'meals'>; cuisine?: string[]; dietary?: string[]; price?: number; chefId?: Id<'chefs'>;[key: string]: unknown }> = [];
  const cuisineCounts = new Map<string, number>();
  const dietaryTagCounts = new Map<string, number>();
  const chefIds = new Set<string>();
  const prices: number[] = [];

  for (const meal of likedMeals) {
    if (!meal) continue;

    const mealAny = meal as { _id: Id<'meals'>; cuisine?: string[]; dietary?: string[]; price?: number; chefId?: Id<'chefs'>;[key: string]: unknown };
    validLikedMeals.push(mealAny);

    // Count cuisines
    if (mealAny.cuisine && Array.isArray(mealAny.cuisine)) {
      for (const cuisine of mealAny.cuisine) {
        const cuisineLower = cuisine.toLowerCase();
        cuisineCounts.set(cuisineLower, (cuisineCounts.get(cuisineLower) || 0) + 1);
      }
    }

    // Count dietary tags
    if (mealAny.dietary && Array.isArray(mealAny.dietary)) {
      for (const tag of mealAny.dietary) {
        const tagLower = tag.toLowerCase();
        dietaryTagCounts.set(tagLower, (dietaryTagCounts.get(tagLower) || 0) + 1);
      }
    }

    // Track chef IDs
    if (mealAny.chefId) {
      chefIds.add(mealAny.chefId as string);
    }

    // Track prices
    if (typeof mealAny.price === 'number' && mealAny.price > 0) {
      prices.push(mealAny.price);
    }
  }

  // Calculate average price and price range
  let averagePrice: number | undefined;
  let priceRange: { min: number; max: number } | undefined;
  if (prices.length > 0) {
    averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  return {
    preferredCuisines: cuisineCounts,
    preferredDietaryTags: dietaryTagCounts,
    preferredPriceRange: priceRange,
    preferredChefIds: chefIds,
    averagePrice,
    likedMeals: validLikedMeals,
  };
}

/**
 * Calculate similarity score between two individual meals
 */
function calculateMealSimilarity(
  meal1: { cuisine?: string[]; dietary?: string[]; price?: number; chefId?: string | Id<'chefs'>;[key: string]: unknown },
  meal2: { cuisine?: string[]; dietary?: string[]; price?: number; chefId?: string | Id<'chefs'>;[key: string]: unknown }
): number {
  let similarityScore = 0;

  // Cuisine similarity
  if (meal1.cuisine && meal2.cuisine && Array.isArray(meal1.cuisine) && Array.isArray(meal2.cuisine)) {
    const cuisines1 = meal1.cuisine.map((c: string) => c.toLowerCase());
    const cuisines2 = meal2.cuisine.map((c: string) => c.toLowerCase());
    const commonCuisines = cuisines1.filter((c: string) => cuisines2.includes(c));
    similarityScore += commonCuisines.length * 15; // Higher weight for individual meal similarity
  }

  // Dietary tag similarity
  if (meal1.dietary && meal2.dietary && Array.isArray(meal1.dietary) && Array.isArray(meal2.dietary)) {
    const dietary1 = meal1.dietary.map((d: string) => d.toLowerCase());
    const dietary2 = meal2.dietary.map((d: string) => d.toLowerCase());
    const commonDietary = dietary1.filter((d: string) => dietary2.includes(d));
    similarityScore += commonDietary.length * 10;
  }

  // Price similarity (within 20% of each other)
  if (meal1.price && meal2.price && typeof meal1.price === 'number' && typeof meal2.price === 'number') {
    const priceDiff = Math.abs(meal1.price - meal2.price);
    const avgPrice = (meal1.price + meal2.price) / 2;
    if (priceDiff < avgPrice * 0.2) {
      similarityScore += 8;
    }
  }

  // Same chef bonus
  const chefId1 = meal1.chefId as string | undefined;
  const chefId2 = meal2.chefId as string | undefined;
  if (chefId1 && chefId2 && chefId1 === chefId2) {
    similarityScore += 20;
  }

  return similarityScore;
}

/**
 * Calculate similarity score between a meal and user's taste profile
 * This includes both aggregate patterns and individual meal similarity
 */
function calculateTasteSimilarity(
  meal: { cuisine?: string[]; dietary?: string[]; price?: number; chefId?: string | Id<'chefs'>; _id?: string | Id<'meals'>; id?: string;[key: string]: unknown },
  tasteProfile: TasteProfile
): number {
  let score = 0;

  // First, check similarity to individual liked meals (stronger signal)
  // Skip if this is the exact liked meal (it already gets +60 boost)
  const mealId = meal._id || meal.id;
  const isExactLikedMeal = mealId && tasteProfile.likedMeals.some((likedMeal) => likedMeal._id === mealId);

  if (tasteProfile.likedMeals.length > 0 && !isExactLikedMeal) {
    let maxSimilarity = 0;
    for (const likedMeal of tasteProfile.likedMeals) {
      const similarity = calculateMealSimilarity(meal, likedMeal);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    // Boost meals similar to any liked meal (scaled down to avoid double counting)
    if (maxSimilarity > 0) {
      score += Math.min(maxSimilarity * 0.5, 40); // Cap at 40 points for individual similarity
    }
  }

  // Aggregate pattern matching (existing logic)
  // Cuisine similarity
  if (meal.cuisine && Array.isArray(meal.cuisine) && tasteProfile.preferredCuisines.size > 0) {
    for (const cuisine of meal.cuisine) {
      const cuisineLower = cuisine.toLowerCase();
      const count = tasteProfile.preferredCuisines.get(cuisineLower) || 0;
      if (count > 0) {
        // More liked meals with this cuisine = higher score
        score += count * 5;
      }
    }
  }

  // Dietary tag similarity
  if (meal.dietary && Array.isArray(meal.dietary) && tasteProfile.preferredDietaryTags.size > 0) {
    for (const tag of meal.dietary) {
      const tagLower = tag.toLowerCase();
      const count = tasteProfile.preferredDietaryTags.get(tagLower) || 0;
      if (count > 0) {
        score += count * 3;
      }
    }
  }

  // Price similarity (prefer meals in similar price range)
  if (meal.price && typeof meal.price === 'number' && tasteProfile.preferredPriceRange) {
    const { min, max } = tasteProfile.preferredPriceRange;
    if (meal.price >= min && meal.price <= max) {
      score += 10;
    } else if (tasteProfile.averagePrice) {
      // Partial credit for being close to average
      const diff = Math.abs(meal.price - tasteProfile.averagePrice);
      const avgPrice = tasteProfile.averagePrice;
      if (diff < avgPrice * 0.2) {
        score += 5;
      }
    }
  }

  // Chef similarity (meals from chefs whose meals user has liked)
  const mealChefId = meal.chefId as string | undefined;
  if (mealChefId && tasteProfile.preferredChefIds.has(mealChefId)) {
    score += 15;
  }

  return score;
}

/**
 * Check if a meal should be included based on user preferences
 */
export function shouldIncludeMeal(
  meal: { allergens?: string[]; dietary?: string[]; chef?: { verificationStatus?: string; verificationDocuments?: { healthPermit?: boolean };[key: string]: unknown };[key: string]: unknown },
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

  // If user wants to avoid cross-contamination, check chef's food safety protocols
  if (preferences.foodSafetySettings.avoid_cross_contamination) {
    const chef = (meal as { chef?: { verificationStatus?: string; verificationDocuments?: { healthPermit?: boolean };[key: string]: unknown } }).chef;
    if (!hasProperCrossContaminationProtocols(chef)) {
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
  meal: { allergens?: string[]; dietary?: string[]; chefId?: string | Id<'chefs'>; chef?: { _id?: string | Id<'chefs'>; verificationStatus?: string; verificationDocuments?: { healthPermit?: boolean };[key: string]: unknown }; _id?: string | Id<'meals'>; id?: string;[key: string]: unknown } | any,
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

  // Check cross-contamination safety (strict exclusion if preference is set)
  if (preferences.foodSafetySettings.avoid_cross_contamination) {
    const chef = (meal as { chef?: { verificationStatus?: string; verificationDocuments?: { healthPermit?: boolean };[key: string]: unknown } }).chef;
    if (!hasProperCrossContaminationProtocols(chef)) {
      score -= 1000; // Heavy penalty
      reasons.push('Does not meet cross-contamination safety standards');
      return { meal, score, reasons };
    }
    // Bonus for meeting safety standards
    score += 25;
    reasons.push('Meets cross-contamination safety standards');
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

  // Liked chef/kitchen: +30 (even if not followed)
  if (mealChefId && preferences.likedChefIds.has(mealChefId as string)) {
    score += 30;
    reasons.push('From liked kitchen');
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
 * Calculate relevance score with taste profile analysis
 * This version uses liked meal patterns to boost similar meals
 */
export async function getMealRelevanceScoreWithTasteProfile(
  ctx: DatabaseCtx,
  meal: { allergens?: string[]; dietary?: string[]; cuisine?: string[]; price?: number; chefId?: string | Id<'chefs'>; chef?: { _id?: string | Id<'chefs'>; verificationStatus?: string; verificationDocuments?: { healthPermit?: boolean };[key: string]: unknown }; _id?: string | Id<'meals'>; id?: string;[key: string]: unknown } | any,
  preferences: UserPreferences,
  tasteProfile: TasteProfile,
  baseScore: number = 0
): Promise<MealRelevanceScore> {
  // First get the base relevance score
  const baseResult = getMealRelevanceScore(meal, preferences, baseScore);

  // If meal was excluded, return early
  if (baseResult.score < -500) {
    return baseResult;
  }

  let score = baseResult.score;
  const reasons = [...baseResult.reasons];

  // Add taste profile similarity boost (includes individual meal similarity)
  if (tasteProfile.likedMeals.length > 0 || tasteProfile.preferredCuisines.size > 0 || tasteProfile.preferredDietaryTags.size > 0) {
    const mealId = meal._id || meal.id;
    const isExactLikedMeal = mealId && tasteProfile.likedMeals.some((likedMeal) => likedMeal._id === mealId);

    // Calculate max similarity to individual liked meals for reason message
    let maxIndividualSimilarity = 0;
    if (tasteProfile.likedMeals.length > 0 && !isExactLikedMeal) {
      for (const likedMeal of tasteProfile.likedMeals) {
        const similarity = calculateMealSimilarity(meal, likedMeal);
        maxIndividualSimilarity = Math.max(maxIndividualSimilarity, similarity);
      }
    }

    const tasteScore = calculateTasteSimilarity(meal, tasteProfile);
    if (tasteScore > 0) {
      score += tasteScore;
      // Provide specific reason based on similarity type
      if (maxIndividualSimilarity > 20) {
        reasons.push('Similar to a meal you liked');
      } else if (maxIndividualSimilarity > 0) {
        reasons.push('Similar to your liked meals');
      } else {
        reasons.push('Matches your taste preferences');
      }
    }
  }

  return { meal, score, reasons };
}

/**
 * Filter meals based on user preferences
 */
export function filterMealsByPreferences<T extends { allergens?: string[]; dietary?: string[];[key: string]: unknown } | any>(
  meals: T[],
  preferences: UserPreferences
): T[] {
  return meals.filter((meal: T) => shouldIncludeMeal(meal as any, preferences));
}

/**
 * Filter and rank meals by user preferences
 */
export function filterAndRankMealsByPreferences<T extends { allergens?: string[]; dietary?: string[]; rating?: number;[key: string]: unknown } | any>(
  meals: T[],
  preferences: UserPreferences,
  baseScoreFn?: (meal: T) => number
): MealRelevanceScore<T>[] {
  const scoredMeals: MealRelevanceScore<T>[] = meals.map((meal: T) => {
    const baseScore = baseScoreFn ? baseScoreFn(meal) : ((meal as { rating?: number }).rating || 0) * 10;
    return getMealRelevanceScore(meal as any, preferences, baseScore) as MealRelevanceScore<T>;
  });

  // Filter out meals with allergens (score < -500)
  const filtered = scoredMeals.filter((s: MealRelevanceScore<T>) => s.score >= -500);

  // Sort by score descending
  filtered.sort((a: MealRelevanceScore<T>, b: MealRelevanceScore<T>) => b.score - a.score);

  return filtered;
}

/**
 * Filter and rank meals by user preferences with taste profile analysis
 * This version uses liked meal patterns to boost similar meals
 */
export async function filterAndRankMealsByPreferencesWithTasteProfile<T extends { allergens?: string[]; dietary?: string[]; cuisine?: string[]; price?: number; rating?: number; chefId?: string | Id<'chefs'>;[key: string]: unknown } | any>(
  ctx: DatabaseCtx,
  meals: T[],
  preferences: UserPreferences,
  tasteProfile: TasteProfile,
  baseScoreFn?: (meal: T) => number
): Promise<MealRelevanceScore<T>[]> {
  const scoredMeals: MealRelevanceScore<T>[] = await Promise.all(
    meals.map(async (meal: T) => {
      const baseScore = baseScoreFn ? baseScoreFn(meal) : ((meal as { rating?: number }).rating || 0) * 10;
      return await getMealRelevanceScoreWithTasteProfile(ctx, meal as any, preferences, tasteProfile, baseScore) as MealRelevanceScore<T>;
    })
  );

  // Filter out meals with allergens (score < -500)
  const filtered = scoredMeals.filter((s: MealRelevanceScore<T>) => s.score >= -500);

  // Sort by score descending
  filtered.sort((a: MealRelevanceScore<T>, b: MealRelevanceScore<T>) => b.score - a.score);

  return filtered;
}

