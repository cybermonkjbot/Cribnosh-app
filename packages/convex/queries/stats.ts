// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

/**
 * Get monthly overview statistics
 */
export const getMonthlyOverview = query({
  args: {
    userId: v.id('users'),
    month: v.string(), // YYYY-MM format
  },
  handler: async (ctx, args) => {
    const [year, monthNum] = args.month.split('-').map(Number);
    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-${new Date(year, monthNum, 0).getDate()}`;

    // Get meal logs for the month directly
    const allMealLogs = await ctx.db
      .query('mealLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    // Filter by date range
    const mealLogs = allMealLogs.filter(log => {
      return log.date >= startDate && log.date <= endDate;
    });

    // Count meals
    const mealsCount = mealLogs.length;

    // Calculate total calories
    const totalCalories = mealLogs.reduce((sum, log) => sum + log.calories, 0);

    // Get streak info directly
    const streakRecord = await ctx.db
      .query('userStreaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    const streakInfo = streakRecord ? {
      current: streakRecord.current_streak,
      best_streak: streakRecord.best_streak,
      streak_start_date: streakRecord.streak_start_date || null,
    } : {
      current: 0,
      best_streak: 0,
      streak_start_date: null,
    };

    // Check if current month
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === monthNum;

    return {
      month: args.month,
      period_label: isCurrentMonth ? 'This Month' : `${new Date(year, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      meals: {
        count: mealsCount,
        period: isCurrentMonth ? 'This Month' : args.month,
      },
      calories: {
        tracked: totalCalories,
        period: isCurrentMonth ? 'This Month' : args.month,
      },
      streak: {
        current: streakInfo.current,
        period: 'Current',
        best_streak: streakInfo.best_streak,
        streak_start_date: streakInfo.streak_start_date,
      },
      updated_at: new Date().toISOString(),
    };
  },
});

/**
 * Get weekly summary statistics
 */
export const getWeeklySummary = query({
  args: {
    userId: v.id('users'),
    startDate: v.string(), // ISO date string (YYYY-MM-DD)
    endDate: v.string(), // ISO date string (YYYY-MM-DD)
  },
  handler: async (ctx, args) => {
    // Get meal logs for the week directly
    const allMealLogs = await ctx.db
      .query('mealLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    // Filter by date range
    const mealLogs = allMealLogs.filter(log => {
      return log.date >= args.startDate && log.date <= args.endDate;
    });

    // Get orders for cuisine extraction
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_customer', (q) => q.eq('customer_id', args.userId))
      .collect();

    // Filter orders in date range
    const weekOrders = orders.filter(order => {
      const orderDate = new Date(order.order_date || order.createdAt);
      const start = new Date(args.startDate);
      const end = new Date(args.endDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    });

    // Extract unique cuisines from orders
    const cuisinesSet = new Set<string>();
    for (const order of weekOrders) {
      for (const item of order.order_items || []) {
        const meal = await ctx.db.get(item.dish_id);
        if (meal && meal.cuisine) {
          if (Array.isArray(meal.cuisine)) {
            meal.cuisine.forEach((c: string) => cuisinesSet.add(c));
          } else {
            cuisinesSet.add(meal.cuisine);
          }
        }
      }
    }

    // Calculate meals per day (Monday-Sunday)
    // Find Monday of the week containing endDate
    const endDateObj = new Date(args.endDate);
    const dayOfWeek = endDateObj.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(endDateObj);
    monday.setDate(endDateObj.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekMeals = [0, 0, 0, 0, 0, 0, 0]; // Monday to Sunday
    const dailyCaloriesMap: Record<string, number> = {};

    // Initialize daily calories map for the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyCaloriesMap[dateStr] = 0;
    }

    // Process meal logs
    mealLogs.forEach(log => {
      const logDate = new Date(log.date);
      const daysSinceMonday = Math.floor((logDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceMonday >= 0 && daysSinceMonday < 7) {
        weekMeals[daysSinceMonday]++;
        if (dailyCaloriesMap[log.date] !== undefined) {
          dailyCaloriesMap[log.date] += log.calories;
        }
      }
    });

    // Calculate average meals
    const avgMeals = weekMeals.reduce((sum, count) => sum + count, 0) / 7;

    // Get today and yesterday calories
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const kcalToday = dailyCaloriesMap[today] || 0;
    const kcalYesterday = dailyCaloriesMap[yesterdayStr] || 0;

    // Build daily calories array (Monday to Sunday, most recent first)
    const dailyCalories = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyCalories.push({
        date: dateStr,
        kcal: dailyCaloriesMap[dateStr] || 0,
      });
    }
    dailyCalories.reverse(); // Most recent first

    const weekEndStr = args.endDate;
    const weekStartStr = monday.toISOString().split('T')[0];

    return {
      week_start: weekStartStr,
      week_end: weekEndStr,
      week_meals: weekMeals,
      avg_meals: Math.round(avgMeals * 10) / 10,
      kcal_today: kcalToday,
      kcal_yesterday: kcalYesterday,
      cuisines: Array.from(cuisinesSet),
      daily_calories: dailyCalories,
      updated_at: new Date().toISOString(),
    };
  },
});

