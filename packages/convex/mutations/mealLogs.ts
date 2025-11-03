import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { mutation } from '../_generated/server';

/**
 * Create a meal log entry
 */
export const createMealLog = mutation({
  args: {
    userId: v.id('users'),
    orderId: v.optional(v.id('orders')),
    mealType: v.union(
      v.literal('breakfast'),
      v.literal('lunch'),
      v.literal('dinner'),
      v.literal('snacks')
    ),
    calories: v.number(),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    mealId: v.optional(v.id('meals')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create meal log entry
    const mealLogId = await ctx.db.insert('mealLogs', {
      userId: args.userId,
      order_id: args.orderId,
      meal_type: args.mealType,
      calories: args.calories,
      date: args.date,
      meal_id: args.mealId,
      created_at: now,
    });

    // Update streak
    await ctx.runMutation(api.mutations.streaks.updateStreak, {
      userId: args.userId,
      activityDate: args.date,
    });

    // Update ForkPrint score (+2 points for meal logged)
    await ctx.runMutation(api.mutations.forkPrint.updateScore, {
      userId: args.userId,
      pointsDelta: 2,
    });

    return mealLogId;
  },
});

/**
 * Bulk create meal logs from an order
 */
export const bulkCreateMealLogs = mutation({
  args: {
    userId: v.id('users'),
    orderId: v.id('orders'),
    orderItems: v.array(v.object({
      mealId: v.id('meals'),
      quantity: v.number(),
    })),
    orderDate: v.string(), // ISO date string
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const mealLogIds: Id<'mealLogs'>[] = [];
    
    // Get order date and determine meal type based on time
    const orderDateTime = new Date(args.orderDate);
    const orderHour = orderDateTime.getHours();
    let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    
    if (orderHour >= 6 && orderHour < 12) {
      mealType = 'breakfast';
    } else if (orderHour >= 12 && orderHour < 18) {
      mealType = 'lunch';
    } else if (orderHour >= 18 && orderHour < 22) {
      mealType = 'dinner';
    } else {
      mealType = 'snacks';
    }

    // Extract date in YYYY-MM-DD format
    const dateStr = args.orderDate.split('T')[0];

    // Get meal calories for each order item
    for (const item of args.orderItems) {
      const meal = await ctx.db.get(item.mealId);
      if (!meal) continue;

      const calories = (meal.calories || 0) * item.quantity;
      if (calories === 0) continue; // Skip if no calories data

      const mealLogId = await ctx.db.insert('mealLogs', {
        userId: args.userId,
        order_id: args.orderId,
        meal_type: mealType,
        calories,
        date: dateStr,
        meal_id: item.mealId,
        created_at: now,
      });

      mealLogIds.push(mealLogId);
    }

    // Update streak once for the order date
    if (mealLogIds.length > 0) {
      await ctx.runMutation(api.mutations.streaks.updateStreak, {
        userId: args.userId,
        activityDate: dateStr,
      });
    }

    // Update ForkPrint score (+2 points per meal logged)
    await ctx.runMutation(api.mutations.forkPrint.updateScore, {
      userId: args.userId,
      pointsDelta: 2 * mealLogIds.length,
    });

    return mealLogIds;
  },
});

