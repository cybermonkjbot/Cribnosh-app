import { v } from 'convex/values';
import { mutation } from '../_generated/server';

// ForkPrint level definitions
const FORKPRINT_LEVELS = [
  { name: 'Starter', min: 0, max: 99 },
  { name: 'Tastemaker', min: 100, max: 499 },
  { name: 'Food Influencer', min: 500, max: 999 },
  { name: "Chef's Choice", min: 1000, max: 2499 },
  { name: 'Culinary Master', min: 2500, max: Infinity },
];

function determineLevel(score: number): { current: typeof FORKPRINT_LEVELS[0]; next: typeof FORKPRINT_LEVELS[0] | null } {
  const current = FORKPRINT_LEVELS.find(level => score >= level.min && score < level.max) || FORKPRINT_LEVELS[0];
  const next = FORKPRINT_LEVELS.find(level => level.min > current.max) || null;
  return { current, next };
}

/**
 * Update ForkPrint score for a user
 * Creates record if it doesn't exist
 */
export const updateScore = mutation({
  args: {
    userId: v.id('users'),
    pointsDelta: v.number(), // Points to add (can be negative)
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get or create forkPrint score record
    let scoreRecord = await ctx.db
      .query('forkPrintScores')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    let newScore = args.pointsDelta;
    if (scoreRecord) {
      newScore = scoreRecord.score + args.pointsDelta;
      // Ensure score doesn't go below 0
      newScore = Math.max(0, newScore);
    }

    // Determine level
    const { current, next } = determineLevel(newScore);
    const pointsToNext = next ? Math.max(0, next.min - newScore) : 0;

    // Get level history from forkPrintLevelHistory table
    const levelHistory = await ctx.db
      .query('forkPrintLevelHistory')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const levelHistoryFormatted = levelHistory.map(entry => ({
      level: entry.level,
      unlocked_at: new Date(entry.unlocked_at).toISOString(),
    }));

    // Check if level changed (new level unlocked)
    const previousLevel = scoreRecord ? scoreRecord.status : null;
    if (previousLevel !== current.name) {
      // New level unlocked - check if already recorded
      const existingLevel = await ctx.db
        .query('forkPrintLevelHistory')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .filter((q) => q.eq(q.field('level'), current.name))
        .first();
      
      if (!existingLevel) {
        // Record new level unlock
        await ctx.db.insert('forkPrintLevelHistory', {
          userId: args.userId,
          level: current.name,
          unlocked_at: now,
        });
      }
    }

    if (scoreRecord) {
      // Update existing record
      await ctx.db.patch(scoreRecord._id, {
        score: newScore,
        status: current.name,
        points_to_next: pointsToNext,
        next_level: next?.name || '',
        level_history: levelHistoryFormatted,
        updated_at: now,
      });
    } else {
      // Create new record
      await ctx.db.insert('forkPrintScores', {
        userId: args.userId,
        score: newScore,
        status: current.name,
        points_to_next: pointsToNext,
        next_level: next?.name || '',
        level_history: levelHistoryFormatted,
        updated_at: now,
      });
    }

    return { score: newScore, level: current.name };
  },
});

/**
 * Record level unlock in forkPrintLevelHistory
 */
export const unlockLevel = mutation({
  args: {
    userId: v.id('users'),
    level: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if this level is already unlocked
    const existing = await ctx.db
      .query('forkPrintLevelHistory')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('level'), args.level))
      .first();

    if (!existing) {
      // Record new level unlock
      await ctx.db.insert('forkPrintLevelHistory', {
        userId: args.userId,
        level: args.level,
        unlocked_at: now,
      });
    }

    return { level: args.level, unlocked_at: now };
  },
});

