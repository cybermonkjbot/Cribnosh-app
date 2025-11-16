import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { ErrorCode, ErrorFactory } from '@/lib/errors';
import { MonitoringService } from '@/lib/monitoring/monitoring.service';
import { calculateEcoImpact } from '@/lib/utils/ecoImpact';
import { dispatchToProvider } from '../providers/dispatch';
import { DishRecommendation, EmotionsEngineRequest, EmotionsEngineResponse, Provider } from '../types';
import { chooseProvider } from './providerSelection';

const monitoring = MonitoringService.getInstance();

function buildSystemPrompt(context: EmotionsEngineRequest): string {
  // Build the dynamic system prompt as per the planning doc
  return `You are CribNosh’s Emotions Engine, an AI that gives food and lifestyle recommendations based on user mood, time of day, location, and preferences.\n\nContext:\n- Mood score: ${context.mood_score}\n- Time: ${context.timeOfDay}\n- Location: ${context.location}\n- Diet: ${context.diet_type || 'none'}\n- Past meals: ${(context.recent_orders || []).join(', ') || 'none'}\n- Weather: ${context.weather || 'unknown'}\n- Active screen: ${context.active_screen}\n\nInstruction:\n- Respond in JSON format with a top-level response_type\n- If the user asked a question, respond as answer\n- If they didn’t but mood is high/low, infer recommendation or send notification\n- Recommend food, snacks, teas, or tips based on context\n\nUser input:\n${context.user_input || 'No input'}`;
}

async function logEmotionsEngineInteraction({ userId, context, provider, query, response }: {
  userId?: string;
  context: Record<string, unknown>;
  provider: string;
  query: string;
  response: unknown;
}) {
  try {
    const { getConvexClient } = await import('@/lib/conxed-client');
    const convex = getConvexClient();
    await convex.mutation((api as any).mutations.emotionsEngine.logEmotionsEngineInteraction, {
      userId,
      context,
      provider,
      query,
      response,
      timestamp: Date.now(),
    });
  } catch (err) {
    monitoring.logError(
      err instanceof Error ? err : new Error(String(err)),
      { context: 'Failed to log Emotions Engine interaction' }
    );
  }
}

/**
 * Lookup actual dishes from Convex based on LLM recommendations
 * Matches recommendation item names to actual dish records
 */
async function lookupDishes(
  recommendations: Array<{ item_name: string; reason?: string; tags?: string[]; badge?: string }>,
  filters?: { category?: string; tag?: string },
  userId?: string
): Promise<DishRecommendation[]> {
  if (!recommendations || recommendations.length === 0) {
    return [];
  }

  try {
    const convex = getConvexClient();
    
    // Get all available meals to search through, with user preference filtering if userId provided
    const allMeals = await convex.query(
      (api as any).queries.meals.getAll,
      userId ? { userId: userId as any } : {}
    );
    
    const dishRecommendations: DishRecommendation[] = [];
    
    // Match each recommendation to actual dishes
    for (const rec of recommendations) {
      if (!rec.item_name) continue;
      
      // Search for meals matching the recommendation name
      const searchTerm = rec.item_name.toLowerCase();
      const matchingMeals = allMeals.filter((meal: any) => {
        const mealName = meal.name?.toLowerCase() || '';
        const mealDesc = meal.description?.toLowerCase() || '';
        const mealCuisine = meal.cuisine?.map((c: string) => c.toLowerCase()) || [];
        
        // Match by name/description/cuisine
        // Also handle cuisine aliases (e.g., "middle eastern" matches "kebab")
        const cuisineAliases: Record<string, string[]> = {
          'middle eastern': ['kebab', 'turkish', 'arabic', 'lebanese'],
          'kebab': ['middle eastern', 'turkish', 'arabic'],
        };
        
        const nameMatch = (
          mealName.includes(searchTerm) ||
          mealDesc.includes(searchTerm) ||
          mealCuisine.some((c: string) => c.includes(searchTerm)) ||
          searchTerm.includes(mealName) ||
          // Check cuisine aliases
          Object.entries(cuisineAliases).some(([key, aliases]) => {
            if (searchTerm.includes(key) || key.includes(searchTerm)) {
              return mealCuisine.some((c: string) => aliases.includes(c));
            }
            if (mealCuisine.some((c: string) => c === key || aliases.includes(c))) {
              return searchTerm.includes(key) || aliases.some(a => searchTerm.includes(a));
            }
            return false;
          })
        );
        
        if (!nameMatch) return false;
        
        // Apply category filter if provided
        if (filters?.category) {
          const mealCategory = meal.category?.toLowerCase() || '';
          const categoryFilter = filters.category.toLowerCase();
          // Match by category field, cuisine, or name/description containing the category
          const categoryMatch = mealCategory === categoryFilter ||
            mealCuisine.some((c: string) => c === categoryFilter) ||
            mealName.includes(categoryFilter) ||
            mealDesc.includes(categoryFilter);
          if (!categoryMatch) return false;
        }
        
        // Apply tag filter if provided
        if (filters?.tag) {
          const mealTags = meal.tags?.map((t: string) => t.toLowerCase()) || [];
          const tagFilter = filters.tag.toLowerCase();
          // Match by tags field, or name/description containing the tag
          const tagMatch = mealTags.includes(tagFilter) ||
            mealDesc.includes(tagFilter) ||
            mealName.includes(tagFilter);
          if (!tagMatch) return false;
        }
        
        return true;
      }).slice(0, 1); // Take first match
      
      // Transform matched meals to DishRecommendation format
      for (const meal of matchingMeals) {
        const imageUrl = meal.images?.[0] 
          ? `/api/files/${meal.images[0]}` 
          : '/default-dish.jpg';
        
        // Calculate relevance score based on match quality
        const mealNameLower = meal.name?.toLowerCase() || '';
        const exactMatch = mealNameLower === searchTerm;
        const containsMatch = mealNameLower.includes(searchTerm) || searchTerm.includes(mealNameLower);
        const relevanceScore = exactMatch ? 1.0 : (containsMatch ? 0.8 : 0.5);
        
        // Determine badge from recommendation or tags
        let badge: string | undefined;
        if (rec.badge) {
          badge = rec.badge.toUpperCase();
        } else if (rec.tags?.some(t => t.toLowerCase().includes('protein'))) {
          badge = 'HIGH PROTEIN';
        } else if (meal.rating && meal.rating >= 4.5) {
          badge = 'BUSSIN';
        }
        
        // Calculate eco impact if filters include "too-fresh" tag
        let ecoImpact: string | undefined;
        if (filters?.tag === 'too-fresh') {
          try {
            const category = meal.category || meal.tags?.[0] || 'Other';
            const impact = calculateEcoImpact(category, 1);
            ecoImpact = impact.formatted;
          } catch (error) {
            console.error('Error calculating eco impact:', error);
          }
        }
        
        dishRecommendations.push({
          dish_id: meal._id,
          name: meal.name || rec.item_name,
          price: Math.round((meal.price || 0) * 100), // Convert to pence
          image_url: imageUrl,
          description: meal.description || '',
          chef_name: meal.chef?.name || `Chef ${meal.chefId}`,
          chef_id: meal.chefId,
          badge,
          relevance_score: relevanceScore,
          dietary_tags: meal.dietary || [],
          rating: meal.averageRating || meal.rating || 0,
          review_count: meal.reviewCount || 0,
          eco_impact: ecoImpact,
        });
      }
    }
    
    // Sort by relevance score descending, then by rating
    dishRecommendations.sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return b.rating - a.rating;
    });
    
    // Limit to top 5 recommendations
    return dishRecommendations.slice(0, 5);
  } catch (err) {
    monitoring.logError(
      err instanceof Error ? err : new Error(String(err)),
      { context: 'Failed to lookup dishes for recommendations' }
    );
    return [];
  }
}

export async function runInference(
  request: EmotionsEngineRequest
): Promise<EmotionsEngineResponse> {
  // Extract category and tag filters from request
  const filters = {
    category: (request as any).category,
    tag: (request as any).tag,
  };
  const userId = (request as any).userId;
  const searchQuery = (request as any).searchQuery || (request as any).query || (request as any).q;
  
  // If we have filters (category or tag), do direct search first
  if (filters.category || filters.tag) {
    try {
      const convex = getConvexClient();
      // Add limit to prevent fetching all meals (1000 max for search)
      const allMeals = await convex.query(
        (api as any).queries.meals.getAll,
        userId ? { userId: userId as any, limit: 1000 } : { limit: 1000 }
      );
      
      const searchTerm = searchQuery ? searchQuery.toLowerCase() : '';
      // Handle cuisine aliases (e.g., "middle eastern" matches "kebab")
      const cuisineAliases: Record<string, string[]> = {
        'middle eastern': ['kebab', 'turkish', 'arabic', 'lebanese'],
        'kebab': ['middle eastern', 'turkish', 'arabic'],
      };
      
      // Get cuisine filter from request if provided
      const cuisineFilter = (request as any).cuisine || (request as any).cuisinePreferences?.[0];
      
      const matchingMeals = allMeals.filter((meal: any) => {
        const mealName = meal.name?.toLowerCase() || '';
        const mealDesc = meal.description?.toLowerCase() || '';
        const mealCuisine = meal.cuisine?.map((c: string) => c.toLowerCase()) || [];
        
        // Match by search query if provided
        if (searchTerm) {
          const nameMatch = mealName.includes(searchTerm) ||
            mealDesc.includes(searchTerm) ||
            mealCuisine.some((c: string) => c.includes(searchTerm)) ||
            searchTerm.includes(mealName) ||
            // Check cuisine aliases
            Object.entries(cuisineAliases).some(([key, aliases]) => {
              if (searchTerm.includes(key) || key.includes(searchTerm)) {
                return mealCuisine.some((c: string) => aliases.includes(c));
              }
              if (mealCuisine.some((c: string) => c === key || aliases.includes(c))) {
                return searchTerm.includes(key) || aliases.some(a => searchTerm.includes(a));
              }
              return false;
            });
          if (!nameMatch) return false;
        }
        
        // Apply cuisine filter if provided
        if (cuisineFilter) {
          const cuisineFilterLower = cuisineFilter.toLowerCase();
          const cuisineMatch = mealCuisine.some((c: string) => c === cuisineFilterLower) ||
            // Check cuisine aliases
            Object.entries(cuisineAliases).some(([key, aliases]) => {
              if (cuisineFilterLower === key || aliases.includes(cuisineFilterLower)) {
                return mealCuisine.some((c: string) => c === key || aliases.includes(c));
              }
              return false;
            });
          if (!cuisineMatch) return false;
        }
        
        // Apply category filter
        if (filters.category) {
          const categoryFilter = filters.category.toLowerCase();
          const categoryMatch = mealName.includes(categoryFilter) ||
            mealDesc.includes(categoryFilter) ||
            mealCuisine.some((c: string) => c === categoryFilter);
          if (!categoryMatch) return false;
        }
        
        // Apply tag filter
        if (filters.tag) {
          const tagFilter = filters.tag.toLowerCase();
          const tagMatch = mealDesc.includes(tagFilter) ||
            mealName.includes(tagFilter);
          if (!tagMatch) return false;
        }
        
        return true;
      });
      
      // Convert to DishRecommendation format with eco impact calculation for too-fresh items
      const dishes: DishRecommendation[] = matchingMeals.slice(0, 20).map((meal: any) => {
        // Calculate eco impact if this is a "too-fresh" item
        let ecoImpact: string | undefined;
        if (filters.tag === 'too-fresh') {
          try {
            const category = meal.category || meal.tags?.[0] || 'Other';
            const impact = calculateEcoImpact(category, 1);
            ecoImpact = impact.formatted;
          } catch (error) {
            // If calculation fails, don't include eco impact
            console.error('Error calculating eco impact:', error);
          }
        }
        
        return {
          dish_id: meal._id,
          name: meal.name || '',
          price: Math.round((meal.price || 0) * 100),
          image_url: meal.images?.[0] ? `/api/files/${meal.images[0]}` : '/default-dish.jpg',
          description: meal.description || '',
          chef_name: meal.chef?.name || `Chef ${meal.chefId}`,
          chef_id: meal.chefId,
          badge: meal.rating >= 4.5 ? 'BUSSIN' : undefined,
          relevance_score: 1.0,
          dietary_tags: meal.dietary || [],
          rating: meal.averageRating || meal.rating || 0,
          review_count: meal.reviewCount || 0,
          eco_impact: ecoImpact,
        };
      });
      
      if (dishes.length > 0) {
        return {
          success: true,
          data: {
            response_type: 'recommendation' as const,
            intent: 'recommendation',
            inferred_context: {},
            dishes: dishes,
            message: 'Search completed successfully',
          },
          message: 'Search completed successfully',
        };
      }
    } catch (err) {
      monitoring.logError(
        err instanceof Error ? err : new Error(String(err)),
        { context: 'Direct search failed, falling back to LLM' }
      );
    }
  }
  
  const provider: Provider = chooseProvider(request);
  const systemPrompt = buildSystemPrompt(request);
  let rawReply: string = '';
  let parsed: any = null;
  const start = Date.now();
  try {
    rawReply = await dispatchToProvider(provider, systemPrompt, request.user_input || '');
    parsed = JSON.parse(rawReply);
    // Validate minimal structure
    if (!parsed.response_type) throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Missing response_type');
    const duration = Date.now() - start;
    monitoring.logInfo('EmotionsEngine LLM success', {
      provider,
      duration,
      intent: request.intent,
      response_type: parsed.response_type,
    });
    monitoring.incrementMetric('emotions_engine_success_total');
    
    // Lookup actual dishes if recommendations are present
    let dishes: DishRecommendation[] = [];
    if (parsed.recommendations && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      dishes = await lookupDishes(parsed.recommendations, filters, userId);
    }
    
    // Log to Convex
    logEmotionsEngineInteraction({
      userId: (request as any).userId,
      context: request,
      provider,
      query: systemPrompt + '\n\n' + (request.user_input || ''),
      response: parsed,
    });
    
    return {
      success: true,
      data: {
        ...parsed,
        inferred_context: request,
        dishes: dishes.length > 0 ? dishes : undefined,
      },
      message: parsed.message || 'Emotions Engine response',
    };
  } catch (err) {
    const duration = Date.now() - start;
    monitoring.logError(
      err instanceof Error ? err : new Error(String(err)),
      {
        context: 'EmotionsEngine LLM error',
        provider,
        duration,
        intent: request.intent,
      }
    );
    monitoring.incrementMetric('emotions_engine_fallback_total');
    // Log fallback to Convex
    logEmotionsEngineInteraction({
      userId: (request as any).userId,
      context: request,
      provider,
      query: systemPrompt + '\n\n' + (request.user_input || ''),
      response: { error: err instanceof Error ? err.message : String(err) },
    });
    return {
      success: false,
      data: {
        response_type: 'fallback',
        intent: request.intent || 'unknown',
        inferred_context: request,
        message: 'Failed to parse LLM response',
      },
      message: 'Emotions Engine fallback',
    };
  }
} 