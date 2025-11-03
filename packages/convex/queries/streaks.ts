import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

/**
 * Get streak information by user ID
 */
export const getStreakByUserId = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const streakRecord = await ctx.db
      .query('userStreaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!streakRecord) {
      return {
        current: 0,
        best_streak: 0,
        streak_start_date: null,
        last_activity_date: null,
      };
    }

    return {
      current: streakRecord.current_streak,
      best_streak: streakRecord.best_streak,
      streak_start_date: streakRecord.streak_start_date || null,
      last_activity_date: streakRecord.last_activity_date,
    };
  },
});

