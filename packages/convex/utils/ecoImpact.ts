// @ts-nocheck
/**
 * Eco Impact Calculation Utility
 * 
 * Calculates CO2 savings for "Too Fresh to Waste" items based on:
 * - Food category (meat, vegetables, etc.)
 * - Weight/quantity
 * - Waste reduction factor
 */

// CO2 emission factors per kg of food waste (in kg CO2 equivalent)
// Based on average food waste emissions and category-specific factors
const CO2_FACTORS: Record<string, number> = {
  // High impact categories
  'Meat': 27.0, // kg CO2 per kg of meat waste
  'Seafood': 12.0,
  'Dairy': 3.2,
  
  // Medium impact categories
  'Bakery': 2.5,
  'Herbs': 1.8,
  
  // Lower impact categories
  'Fruits': 1.2,
  'Vegetables': 1.0,
  'Other': 2.0, // Default average
};

// Average weight per serving/item (in kg)
const AVERAGE_WEIGHT_PER_SERVING: Record<string, number> = {
  'Meat': 0.15, // 150g per serving
  'Seafood': 0.12,
  'Dairy': 0.1,
  'Bakery': 0.08,
  'Herbs': 0.02,
  'Fruits': 0.15,
  'Vegetables': 0.12,
  'Other': 0.1, // Default
};

/**
 * Calculate CO2 savings for a food item
 * @param category - Food category (e.g., 'Meat', 'Vegetables')
 * @param quantity - Number of servings/items (default: 1)
 * @param weightKg - Optional specific weight in kg (overrides category average)
 * @returns CO2 savings in kg CO2 equivalent, formatted string, and raw value
 */
export function calculateEcoImpact(
  category: string,
  quantity: number = 1,
  weightKg?: number
): {
  co2Kg: number;
  formatted: string;
} {
  // Normalize category name
  const normalizedCategory = normalizeCategory(category);
  
  // Get CO2 factor for category
  const co2Factor = CO2_FACTORS[normalizedCategory] || CO2_FACTORS['Other'];
  
  // Calculate weight
  const avgWeight = AVERAGE_WEIGHT_PER_SERVING[normalizedCategory] || AVERAGE_WEIGHT_PER_SERVING['Other'];
  const totalWeight = weightKg !== undefined ? weightKg : (avgWeight * quantity);
  
  // Calculate CO2 savings (preventing waste = saving emissions)
  // We use 0.8 as a factor to account for the fact that some items might have been
  // partially consumed or are closer to expiration
  const wasteReductionFactor = 0.8;
  const co2Kg = totalWeight * co2Factor * wasteReductionFactor;
  
  // Format the result
  const formatted = formatEcoImpact(co2Kg);
  
  return {
    co2Kg: Math.round(co2Kg * 10) / 10, // Round to 1 decimal place
    formatted,
  };
}

/**
 * Normalize category name to match our factor keys
 */
function normalizeCategory(category: string): string {
  const normalized = category.trim();
  
  // Direct matches
  if (CO2_FACTORS[normalized]) {
    return normalized;
  }
  
  // Fuzzy matching
  const lower = normalized.toLowerCase();
  
  if (lower.includes('meat') || lower.includes('beef') || lower.includes('pork') || lower.includes('chicken')) {
    return 'Meat';
  }
  if (lower.includes('seafood') || lower.includes('fish') || lower.includes('shrimp')) {
    return 'Seafood';
  }
  if (lower.includes('dairy') || lower.includes('cheese') || lower.includes('milk')) {
    return 'Dairy';
  }
  if (lower.includes('bakery') || lower.includes('bread') || lower.includes('pastry')) {
    return 'Bakery';
  }
  if (lower.includes('herb') || lower.includes('spice')) {
    return 'Herbs';
  }
  if (lower.includes('fruit')) {
    return 'Fruits';
  }
  if (lower.includes('vegetable') || lower.includes('veg')) {
    return 'Vegetables';
  }
  
  return 'Other';
}

/**
 * Format CO2 impact as a user-friendly string
 */
function formatEcoImpact(co2Kg: number): string {
  if (co2Kg < 0.1) {
    return `Saves ${(co2Kg * 1000).toFixed(0)}g CO2`;
  } else if (co2Kg < 1) {
    return `Saves ${co2Kg.toFixed(1)}kg CO2`;
  } else {
    return `Saves ${co2Kg.toFixed(1)}kg CO2`;
  }
}

/**
 * Calculate total eco impact for multiple items
 */
export function calculateTotalEcoImpact(
  items: Array<{ category: string; quantity?: number; weightKg?: number }>
): {
  totalCo2Kg: number;
  formatted: string;
  itemCount: number;
} {
  const total = items.reduce((sum, item) => {
    const impact = calculateEcoImpact(
      item.category,
      item.quantity || 1,
      item.weightKg
    );
    return sum + impact.co2Kg;
  }, 0);
  
  return {
    totalCo2Kg: Math.round(total * 10) / 10,
    formatted: formatEcoImpact(total),
    itemCount: items.length,
  };
}

