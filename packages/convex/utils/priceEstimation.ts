import { QueryCtx, MutationCtx } from '../_generated/server';

// Common database context type that works for both queries and mutations
type DatabaseCtx = QueryCtx | MutationCtx;

// Configuration constants
const BASE_PRICE_PER_SERVING = 10; // £10 per serving
const MIN_PRICE = 15; // Minimum order price: £15
const MAX_PRICE = 200; // Maximum order price: £200
const DIETARY_MODIFIER = 0.15; // +15% for dietary restrictions
const COMPLEXITY_MODIFIER = 0.20; // +20% for complex dishes

// Dietary restriction keywords that trigger price modifier
const DIETARY_KEYWORDS = [
  'vegan',
  'vegetarian',
  'gluten-free',
  'gluten free',
  'dairy-free',
  'dairy free',
  'nut-free',
  'nut free',
  'halal',
  'kosher',
  'paleo',
  'keto',
];

// Complexity indicators that suggest a more complex dish
const COMPLEXITY_KEYWORDS = [
  'platter',
  'feast',
  'multi-course',
  'multi course',
  'custom',
  'special',
  'exotic',
  'gourmet',
  'artisanal',
  'signature',
];

/**
 * Parses requirements text to extract cuisine type, complexity, and dietary info
 */
export function parseRequirements(requirements: string): {
  cuisineType: string | null;
  isComplex: boolean;
  hasDietaryRestrictions: boolean;
  keywords: string[];
} {
  const lowerRequirements = requirements.toLowerCase();
  const keywords: string[] = [];
  let isComplex = false;
  let hasDietaryRestrictions = false;

  // Check for dietary restrictions
  for (const keyword of DIETARY_KEYWORDS) {
    if (lowerRequirements.includes(keyword)) {
      hasDietaryRestrictions = true;
      keywords.push(keyword);
      break; // Only need one match
    }
  }

  // Check for complexity indicators
  for (const keyword of COMPLEXITY_KEYWORDS) {
    if (lowerRequirements.includes(keyword)) {
      isComplex = true;
      keywords.push(keyword);
      break;
    }
  }

  // Try to detect cuisine type (simplified - can be enhanced)
  const cuisineTypes = ['italian', 'chinese', 'indian', 'mexican', 'japanese', 'thai', 'french', 'mediterranean'];
  let cuisineType: string | null = null;
  for (const cuisine of cuisineTypes) {
    if (lowerRequirements.includes(cuisine)) {
      cuisineType = cuisine;
      break;
    }
  }

  return {
    cuisineType,
    isComplex,
    hasDietaryRestrictions,
    keywords,
  };
}

/**
 * Calculates base price based on serving size
 */
export function calculateBasePrice(servingSize: number): number {
  return servingSize * BASE_PRICE_PER_SERVING;
}

/**
 * Calculates dietary modifier price adjustment
 */
export function calculateDietaryModifier(
  basePrice: number,
  hasDietaryRestrictions: boolean,
  dietaryRestrictions?: string | null
): number {
  if (!hasDietaryRestrictions && !dietaryRestrictions) {
    return 0;
  }

  // Check if dietary restrictions are explicitly mentioned
  const hasExplicitRestrictions = dietaryRestrictions && dietaryRestrictions.trim().length > 0;
  if (hasDietaryRestrictions || hasExplicitRestrictions) {
    return basePrice * DIETARY_MODIFIER;
  }

  return 0;
}

/**
 * Finds similar meals in the database to use as pricing reference
 */
export async function findSimilarMealPrice(
  ctx: DatabaseCtx,
  requirements: string,
  cuisineType: string | null
): Promise<number | null> {
  try {
    const meals = await ctx.db.query('meals').collect();
    
    if (meals.length === 0) {
      return null;
    }

    const lowerRequirements = requirements.toLowerCase();
    const similarMeals: number[] = [];

    // Find meals with similar keywords or cuisine type
    for (const meal of meals) {
      const mealNameLower = meal.name.toLowerCase();
      const mealDescriptionLower = meal.description.toLowerCase();
      
      // Extract keywords from requirements
      const requirementWords = lowerRequirements.split(/\s+/).filter(word => word.length > 3);
      
      // Check for keyword matches
      let matchScore = 0;
      for (const word of requirementWords) {
        if (mealNameLower.includes(word) || mealDescriptionLower.includes(word)) {
          matchScore++;
        }
      }

      // Check cuisine match
      if (cuisineType && meal.cuisine && meal.cuisine.length > 0) {
        const mealCuisines = meal.cuisine.map(c => c.toLowerCase());
        if (mealCuisines.includes(cuisineType)) {
          matchScore += 2; // Cuisine match is weighted higher
        }
      }

      // If we have a reasonable match (at least 1 keyword or cuisine match)
      if (matchScore > 0 && meal.status === 'available') {
        similarMeals.push(meal.price);
      }
    }

    if (similarMeals.length === 0) {
      return null;
    }

    // Return average price of similar meals
    const averagePrice = similarMeals.reduce((sum, price) => sum + price, 0) / similarMeals.length;
    return averagePrice;
  } catch (error) {
    // If query fails, return null and use base calculation
    return null;
  }
}

/**
 * Main function to estimate custom order price
 */
export async function estimateCustomOrderPrice(
  ctx: DatabaseCtx,
  requirements: string,
  servingSize: number,
  dietaryRestrictions?: string | null
): Promise<number> {
  // Parse requirements to extract information
  const parsed = parseRequirements(requirements);

  // Try to find similar meal price first
  const similarMealPrice = await findSimilarMealPrice(ctx, requirements, parsed.cuisineType);

  let basePrice: number;

  if (similarMealPrice !== null) {
    // Use similar meal price as base, adjusted for serving size
    // Assume similar meal is for 1-2 servings, so we scale it
    const pricePerServing = similarMealPrice / 1.5; // Average serving assumption
    basePrice = pricePerServing * servingSize;
  } else {
    // Use standard base price calculation
    basePrice = calculateBasePrice(servingSize);
  }

  // Apply dietary modifier
  const dietaryModifier = calculateDietaryModifier(
    basePrice,
    parsed.hasDietaryRestrictions,
    dietaryRestrictions
  );

  // Apply complexity modifier
  const complexityModifier = parsed.isComplex ? basePrice * COMPLEXITY_MODIFIER : 0;

  // Calculate final price
  let finalPrice = basePrice + dietaryModifier + complexityModifier;

  // Apply min/max bounds
  finalPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, finalPrice));

  // Round to 2 decimal places
  return Math.round(finalPrice * 100) / 100;
}

