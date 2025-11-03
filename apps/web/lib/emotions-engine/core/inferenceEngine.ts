import { api } from '@/convex/_generated/api';
import { MonitoringService } from '@/lib/monitoring/monitoring.service';
import { dispatchToProvider } from '../providers/dispatch';
import { EmotionsEngineRequest, EmotionsEngineResponse, Provider, DishRecommendation } from '../types';
import { chooseProvider } from './providerSelection';
import { ErrorFactory, ErrorCode } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';

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
    await convex.mutation(api.mutations.emotionsEngine.logEmotionsEngineInteraction, {
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
  recommendations: Array<{ item_name: string; reason?: string; tags?: string[]; badge?: string }>
): Promise<DishRecommendation[]> {
  if (!recommendations || recommendations.length === 0) {
    return [];
  }

  try {
    const convex = getConvexClient();
    
    // Get all available meals to search through
    const allMeals = await convex.query(api.queries.meals.getAll);
    
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
        
        return (
          mealName.includes(searchTerm) ||
          mealDesc.includes(searchTerm) ||
          mealCuisine.some((c: string) => c.includes(searchTerm)) ||
          searchTerm.includes(mealName)
        );
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
      dishes = await lookupDishes(parsed.recommendations);
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