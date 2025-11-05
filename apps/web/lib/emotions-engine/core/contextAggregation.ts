import { EmotionsContext } from '../types';
import { getConvexClient } from '../../conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Real fetch for backend user data from Convex
async function fetchUserData(userId: string): Promise<Partial<EmotionsContext>> {
  try {
    const convex = getConvexClient();
    
    // Fetch user profile and preferences
    const userProfile = await convex.query(api.queries.users.getUserProfile, { userId: userId as Id<"users"> });
    
    // Fetch recent orders
    const recentOrders = await convex.query(api.queries.orders.getRecentOrders, { 
      userId: userId as Id<"users">, 
      limit: 10 
    });
    
    // Fetch dietary preferences
    const dietaryPreferences = await convex.query(api.queries.users.getDietaryPreferences, { userId: userId as Id<"users"> });
    
    // Fetch favorite cuisines
    const favoriteCuisines = await convex.query(api.queries.users.getFavoriteCuisines, { userId: userId as Id<"users"> });
    
    // Extract meal names from order items
    interface OrderItem {
      name: string;
    }
    interface Order {
      items?: OrderItem[];
    }
    const recentMeals = recentOrders?.flatMap((order: Order) => 
      order.items?.map((item: OrderItem) => item.name) || []
    ) || [];
    
    return {
      diet_type: userProfile?.preferences?.dietary?.[0] || 'none',
      recent_orders: recentMeals,
      preferred_cuisine: favoriteCuisines?.[0] || 'Nigerian',
      dietary_tags: dietaryPreferences?.tags || [],
      allergies: dietaryPreferences?.allergies || [],
      spice_preference: 'medium', // Default value since this field doesn't exist in schema
      portion_size: 'regular', // Default value since this field doesn't exist in schema
      budget_range: 'medium', // Default value since this field doesn't exist in schema
      cooking_skill: 'intermediate', // Default value since this field doesn't exist in schema
      time_constraint: 'flexible', // Default value since this field doesn't exist in schema
    } as Partial<EmotionsContext>;
  } catch (error) {
    console.error('Error fetching user data for emotions engine:', error);
    // Return fallback data
    return {
      diet_type: 'none',
      recent_orders: [],
      preferred_cuisine: 'Nigerian',
    };
  }
}

// Aggregates frontend (UI/session) and backend (API/user) context into a single object
export async function aggregateContext(
  uiContext: Partial<EmotionsContext>,
  userId?: string,
  nearbyCuisines?: string[]
): Promise<EmotionsContext> {
  let apiContext: Partial<EmotionsContext> = {};
  if (userId) {
    apiContext = await fetchUserData(userId);
  }
  if (nearbyCuisines) {
    apiContext.nearby_cuisines = nearbyCuisines;
  }
  // Merge, with UI context taking precedence
  return {
    ...apiContext,
    ...uiContext,
  } as EmotionsContext;
}

// Example usage:
// const context = await aggregateContext({ mood_score: 3, location: 'Lagos', ... }, 'user-123'); 