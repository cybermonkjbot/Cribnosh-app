// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query('dietaryPreferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!preferences) {
      return {
        preferences: [],
        religious_requirements: [],
        health_driven: [],
        updated_at: new Date().toISOString(),
      };
    }

    return {
      preferences: preferences.preferences,
      religious_requirements: preferences.religious_requirements,
      health_driven: preferences.health_driven,
      updated_at: new Date(preferences.updated_at).toISOString(),
    };
  },
});

