// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';

const DEFAULT_DAILY_GOAL = 2000;

/**
 * Get calories progress for a specific date
 */
export const getCaloriesProgress = query({
  args: {
    userId: v.id('users'),
    date: v.string(), // ISO date string (YYYY-MM-DD)
  },
  handler: async (ctx, args) => {
    // Get meal logs for the date
    const mealLogs = await ctx.db
      .query('mealLogs')
      .withIndex('by_user_and_date', (q) => 
        q.eq('userId', args.userId).eq('date', args.date)
      )
      .collect();

    // Calculate total calories
    const consumed = mealLogs.reduce((sum, log) => sum + log.calories, 0);

    // Calculate breakdown by meal type
    const breakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snacks: 0,
    };

    mealLogs.forEach(log => {
      breakdown[log.meal_type] += log.calories;
    });

    // Get nutrition goal directly from database
    const goal = await ctx.db
      .query('nutritionGoals')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    
    const dailyGoal = goal?.daily_goal || DEFAULT_DAILY_GOAL;
    const remaining = Math.max(0, dailyGoal - consumed);
    const progressPercentage = dailyGoal > 0 
      ? Math.min(100, Math.floor((consumed / dailyGoal) * 100))
      : 0;

    return {
      date: args.date,
      consumed,
      goal: dailyGoal,
      remaining,
      progress_percentage: progressPercentage,
      goal_type: goal?.goal_type || 'daily',
      breakdown,
      updated_at: mealLogs.length > 0 
        ? new Date(Math.max(...mealLogs.map(log => log.created_at))).toISOString()
        : new Date().toISOString(),
    };
  },
});

/**
 * Get nutrition goal for a user (or return default)
 */
export const getNutritionGoal = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db
      .query('nutritionGoals')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!goal) {
      return {
        daily_goal: DEFAULT_DAILY_GOAL,
        goal_type: 'daily',
      };
    }

    return {
      daily_goal: goal.daily_goal,
      goal_type: goal.goal_type,
    };
  },
});

