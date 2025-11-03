import { v } from 'convex/values';
import { query } from '../_generated/server';

/**
 * Get ForkPrint score by user ID
 */
export const getScoreByUserId = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get forkPrint score
    const scoreRecord = await ctx.db
      .query('forkPrintScores')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!scoreRecord) {
      return null;
    }

    // Get level history from forkPrintLevelHistory table
    const levelHistory = await ctx.db
      .query('forkPrintLevelHistory')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc') // Most recent first
      .collect();

    const levelHistoryFormatted = levelHistory.map(entry => ({
      level: entry.level,
      unlocked_at: new Date(entry.unlocked_at).toISOString(),
    }));

    return {
      score: scoreRecord.score,
      status: scoreRecord.status,
      points_to_next: scoreRecord.points_to_next,
      next_level: scoreRecord.next_level,
      current_level_icon: scoreRecord.current_level_icon || null,
      level_history: levelHistoryFormatted,
      updated_at: new Date(scoreRecord.updated_at).toISOString(),
    };
  },
});

