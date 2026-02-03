// @ts-nocheck
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { mutation } from '../_generated/server';

/**
 * Initialize streak for a new user
 */
export const initializeStreak = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already initialized
    const existing = await ctx.db
      .query('userStreaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      return existing;
    }

    // Create initial record with 0 streak
    const streakId = await ctx.db.insert('userStreaks', {
      userId: args.userId,
      current_streak: 0,
      best_streak: 0,
      last_activity_date: today,
      updated_at: now,
    });

    return await ctx.db.get(streakId);
  },
});

/**
 * Update user streak based on activity date
 */
export const updateStreak = mutation({
  args: {
    userId: v.id('users'),
    activityDate: v.string(), // ISO date string (YYYY-MM-DD)
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get or create streak record
    let streakRecord = await ctx.db
      .query('userStreaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!streakRecord) {
      // Initialize streak record
      const today = new Date().toISOString().split('T')[0];
      const streakId = await ctx.db.insert('userStreaks', {
        userId: args.userId,
        current_streak: 0,
        best_streak: 0,
        last_activity_date: today,
        updated_at: now,
      });
      streakRecord = await ctx.db.get(streakId);
      if (!streakRecord) {
        throw new Error('Failed to initialize streak');
      }
    }

    const activityDateObj = new Date(args.activityDate);
    const lastActivityDateObj = new Date(streakRecord.last_activity_date);
    
    // Calculate days difference
    const daysDiff = Math.floor(
      (activityDateObj.getTime() - lastActivityDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newCurrentStreak = streakRecord.current_streak;
    let streakStartDate = streakRecord.streak_start_date;

    if (daysDiff === 0) {
      // Same day - no change needed
      return streakRecord;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      newCurrentStreak = streakRecord.current_streak + 1;
      if (!streakStartDate) {
        streakStartDate = args.activityDate;
      }
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      newCurrentStreak = 1;
      streakStartDate = args.activityDate;
    } else {
      // Activity is in the past - don't update streak
      return streakRecord;
    }

    // Update best streak if current is higher
    const newBestStreak = Math.max(streakRecord.best_streak, newCurrentStreak);

    await ctx.db.patch(streakRecord._id, {
      current_streak: newCurrentStreak,
      best_streak: newBestStreak,
      streak_start_date: streakStartDate,
      last_activity_date: args.activityDate,
      updated_at: now,
    });

    // Award 7-day streak bonus (50 bonus Nosh Points)
    if (newCurrentStreak === 7 && streakRecord.current_streak < 7) {
      // First time reaching 7 days - award bonus
      await ctx.runMutation(api.mutations.noshPoints.addPoints, {
        userId: args.userId,
        points: 50,
        reason: '7-day streak bonus',
      });
    }

    // Update ForkPrint score (+1 point per streak day)
    // Only award if streak increased
    if (newCurrentStreak > streakRecord.current_streak) {
      await ctx.runMutation(api.mutations.forkPrint.updateScore, {
        userId: args.userId,
        pointsDelta: 1,
      });
    }

    return {
      current_streak: newCurrentStreak,
      best_streak: newBestStreak,
      streak_start_date: streakStartDate,
    };
  },
});

