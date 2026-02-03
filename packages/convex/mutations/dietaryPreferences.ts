// @ts-nocheck
import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const updateByUserId = mutation({
  args: {
    userId: v.id('users'),
    preferences: v.array(v.string()),
    religious_requirements: v.array(v.string()),
    health_driven: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('dietaryPreferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        preferences: args.preferences,
        religious_requirements: args.religious_requirements,
        health_driven: args.health_driven,
        updated_at: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert('dietaryPreferences', {
        userId: args.userId,
        preferences: args.preferences,
        religious_requirements: args.religious_requirements,
        health_driven: args.health_driven,
        updated_at: Date.now(),
      });
    }
  },
});

