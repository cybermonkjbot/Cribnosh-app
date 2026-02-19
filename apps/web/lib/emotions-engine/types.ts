// Types for CribNosh Emotions Engine

export type EmotionsContext = {
  user_input?: string;
  mood_score: number;
  location: string;
  timeOfDay: string;
  active_screen: string;
  device_type: string;
  weather?: string;
  usage_patterns?: string;
  user_tier: string;
  diet_type?: string;
  recent_orders?: string[];
  preferred_cuisine?: string;
  nearby_cuisines?: string[];
};

export type Provider = 'gpt-4' | 'gpt-3.5' | 'claude' | 'gemini' | 'huggingface' | 'azure-openai';

export type EmotionsEngineRequest = EmotionsContext & {
  priority?: boolean;
  intent?: string;
};

export type EmotionsEngineResponseType = 'answer' | 'recommendation' | 'notification' | 'fallback' | 'multi_intent';

export interface DishRecommendation {
  dish_id: string;
  name: string;
  price: number; // in pence/cents
  image_url: string;
  description: string;
  chef_name: string;
  chef_id: string;
  badge?: string; // "BUSSIN", "BEST FIT", "HIGH PROTEIN"
  relevance_score: number;
  dietary_tags: string[];
  rating: number;
  review_count: number;
  eco_impact?: string; // CO2 savings for "too-fresh" items
}

export interface EmotionsEngineResponse {
  success: boolean;
  data: {
    response_type: EmotionsEngineResponseType;
    intent: string;
    mood?: string;
    inferred_context: Record<string, any>;
    recommendations?: Array<{
      item_name: string;
      reason: string;
      tags?: string[];
      availability?: boolean;
      chef?: string;
      estimated_ready_time?: string;
    }>;
    dishes?: DishRecommendation[]; // Enriched dish data
    answer?: string;
    followup_suggestions?: string[];
    actions?: Array<{
      type: string;
      payload: Record<string, any>;
    }>;
    message: string;
    triggered_by?: string;
  };
  message: string;
} 