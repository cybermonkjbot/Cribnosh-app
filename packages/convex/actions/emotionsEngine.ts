"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Get emotions engine context - aggregates all context data in Convex
 * This consolidates multiple queries (nearby chefs, user data, preferences) into a single action
 */
export const getEmotionsEngineContext = action({
  args: {
    userId: v.optional(v.id("users")),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const result: {
      nearbyCuisines?: string[];
      userProfile?: any;
      recentOrders?: any[];
      dietaryPreferences?: any;
      favoriteCuisines?: string[];
    } = {};
    
    // Fetch nearby chefs if location is provided
    if (args.location) {
      try {
        const nearbyChefs = await ctx.runQuery(api.queries.chefs.findNearbyChefs, {
          latitude: args.location.latitude,
          longitude: args.location.longitude,
          maxDistanceKm: 10,
        });
        
        // Collect unique cuisines from nearby chefs' specialties
        const cuisineSet = new Set<string>();
        if (Array.isArray(nearbyChefs)) {
          for (const chef of nearbyChefs) {
            if (Array.isArray(chef.specialties)) {
              chef.specialties.forEach((c: string) => cuisineSet.add(c));
            }
          }
        }
        result.nearbyCuisines = Array.from(cuisineSet);
      } catch (error) {
        console.error('Error fetching nearby chefs:', error);
        result.nearbyCuisines = [];
      }
    }
    
    // Fetch user data if userId is provided
    if (args.userId) {
      try {
        // Fetch all user data in parallel
        const [userProfile, recentOrders, dietaryPreferences, favoriteCuisines] = await Promise.all([
          ctx.runQuery(api.queries.users.getUserProfile, { userId: args.userId }),
          ctx.runQuery(api.queries.orders.getRecentOrders, { 
            userId: args.userId, 
            limit: 10 
          }),
          ctx.runQuery(api.queries.users.getDietaryPreferences, { userId: args.userId }),
          ctx.runQuery(api.queries.users.getFavoriteCuisines, { userId: args.userId }),
        ]);
        
        result.userProfile = userProfile;
        result.recentOrders = recentOrders;
        result.dietaryPreferences = dietaryPreferences;
        result.favoriteCuisines = favoriteCuisines;
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Return empty defaults
        result.userProfile = null;
        result.recentOrders = [];
        result.dietaryPreferences = null;
        result.favoriteCuisines = [];
      }
    }
    
    return result;
  },
});

