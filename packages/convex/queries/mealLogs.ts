// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

/**
 * Get meal logs by date range
 */
export const getMealLogsByDateRange = query({
  args: {
    userId: v.id('users'),
    startDate: v.string(), // ISO date string (YYYY-MM-DD)
    endDate: v.string(), // ISO date string (YYYY-MM-DD)
  },
  handler: async (ctx, args) => {
    // Get all meal logs for user
    const allLogs = await ctx.db
      .query('mealLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    // Filter by date range
    const logs = allLogs.filter(log => {
      return log.date >= args.startDate && log.date <= args.endDate;
    });

    return logs.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at - a.created_at;
    });
  },
});

/**
 * Get meals logged in a specific month
 */
export const getMealsByMonth = query({
  args: {
    userId: v.id('users'),
    month: v.string(), // YYYY-MM format
  },
  handler: async (ctx, args) => {
    const [year, monthNum] = args.month.split('-').map(Number);
    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-${new Date(year, monthNum, 0).getDate()}`;

    return await getMealLogsByDateRange(ctx, {
      userId: args.userId,
      startDate,
      endDate,
    });
  },
});

/**
 * Get meals logged in a specific week
 */
export const getMealsByWeek = query({
  args: {
    userId: v.id('users'),
    startDate: v.string(), // ISO date string (YYYY-MM-DD)
    endDate: v.string(), // ISO date string (YYYY-MM-DD)
  },
  handler: async (ctx, args) => {
    return await getMealLogsByDateRange(ctx, args);
  },
});

