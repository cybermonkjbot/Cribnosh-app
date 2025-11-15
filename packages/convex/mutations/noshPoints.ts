import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

/**
 * Initialize Nosh Points for a new user
 */
export const initializePoints = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if already initialized
    const existing = await ctx.db
      .query('noshPoints')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      return existing;
    }

    // Create initial record with 0 points
    const pointsId = await ctx.db.insert('noshPoints', {
      userId: args.userId,
      available_points: 0,
      total_points_earned: 0,
      total_points_spent: 0,
      updated_at: now,
    });

    return await ctx.db.get(pointsId);
  },
});

/**
 * Add points to user's Nosh Points balance
 */
export const addPoints = mutation({
  args: {
    userId: v.id('users'),
    points: v.number(),
    reason: v.string(),
    orderId: v.optional(v.id('orders')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get or create points record
    let pointsRecord = await ctx.db
      .query('noshPoints')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!pointsRecord) {
      // Initialize if doesn't exist
      const initialized = await initializePoints(ctx, { userId: args.userId });
      pointsRecord = initialized;
    }

    // Update points
    const newAvailablePoints = pointsRecord.available_points + args.points;
    const newTotalEarned = pointsRecord.total_points_earned + args.points;

    await ctx.db.patch(pointsRecord._id, {
      available_points: newAvailablePoints,
      total_points_earned: newTotalEarned,
      updated_at: now,
    });

    // Create transaction record
    await ctx.db.insert('noshPointTransactions', {
      userId: args.userId,
      points: args.points, // positive
      type: 'earned',
      reason: args.reason,
      order_id: args.orderId,
      created_at: now,
    });

    return {
      available_points: newAvailablePoints,
      total_points_earned: newTotalEarned,
    };
  },
});

/**
 * Spend points from user's Nosh Points balance
 */
export const spendPoints = mutation({
  args: {
    userId: v.id('users'),
    points: v.number(),
    reason: v.string(),
    orderId: v.optional(v.id('orders')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get points record
    const pointsRecord = await ctx.db
      .query('noshPoints')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!pointsRecord) {
      throw new Error('Nosh Points not initialized for user');
    }

    if (pointsRecord.available_points < args.points) {
      throw new Error('Insufficient Nosh Points');
    }

    // Update points
    const newAvailablePoints = pointsRecord.available_points - args.points;
    const newTotalSpent = pointsRecord.total_points_spent + args.points;

    await ctx.db.patch(pointsRecord._id, {
      available_points: newAvailablePoints,
      total_points_spent: newTotalSpent,
      updated_at: now,
    });

    // Create transaction record
    await ctx.db.insert('noshPointTransactions', {
      userId: args.userId,
      points: -args.points, // negative
      type: 'spent',
      reason: args.reason,
      order_id: args.orderId,
      created_at: now,
    });

    return {
      available_points: newAvailablePoints,
      total_points_spent: newTotalSpent,
    };
  },
});

