// @ts-nocheck
import { v } from 'convex/values';
import { mutation } from '../_generated/server';

const DEFAULT_DAILY_GOAL = 2000;

/**
 * Set or update nutrition goal for a user
 */
export const setNutritionGoal = mutation({
  args: {
    userId: v.id('users'),
    dailyGoal: v.number(),
    goalType: v.optional(v.string()), // defaults to 'daily'
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get existing goal
    const existing = await ctx.db
      .query('nutritionGoals')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      // Update existing goal
      await ctx.db.patch(existing._id, {
        daily_goal: args.dailyGoal,
        goal_type: args.goalType || 'daily',
        updated_at: now,
      });
      return await ctx.db.get(existing._id);
    } else {
      // Create new goal
      const goalId = await ctx.db.insert('nutritionGoals', {
        userId: args.userId,
        daily_goal: args.dailyGoal,
        goal_type: args.goalType || 'daily',
        updated_at: now,
      });
      return await ctx.db.get(goalId);
    }
  },
});

