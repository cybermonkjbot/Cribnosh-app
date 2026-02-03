// @ts-nocheck
import { v } from 'convex/values';
import { query, QueryCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { requireAuth } from '../utils/auth';

/**
 * Get available sides for a specific meal
 */
export const getSidesByMealId = query({
  args: {
    mealId: v.id('meals'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { mealId: Id<'meals'>; sessionToken?: string }) => {
    // Optional authentication - sides can be viewed by anyone
    await requireAuth(ctx, args.sessionToken).catch(() => {
      // Allow unauthenticated access to view sides
    });

    const sides = await ctx.db
      .query('sides')
      .withIndex('by_meal', (q) => q.eq('mealId', args.mealId))
      .filter((q) => q.eq(q.field('available'), true))
      .collect();

    return sides;
  },
});

/**
 * Get available sides for meals in cart
 * Returns sides grouped by meal ID
 */
export const getSidesForCartItems = query({
  args: {
    mealIds: v.array(v.id('meals')),
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(), // Using v.any() for dynamic object keys
  handler: async (ctx: QueryCtx, args: { mealIds: Id<'meals'>[]; sessionToken?: string }) => {
    // Optional authentication
    try {
      await requireAuth(ctx, args.sessionToken);
    } catch {
      // Allow unauthenticated access
    }

    const result: Record<string, any[]> = {};

    if (args.mealIds.length === 0) {
      return result;
    }

    // Get sides for each meal
    for (const mealId of args.mealIds) {
      const sides = await ctx.db
        .query('sides')
        .withIndex('by_meal', (q) => q.eq('mealId', mealId))
        .filter((q) => {
          const available = q.field('available');
          return q.eq(available, true);
        })
        .collect();

      result[mealId] = sides || [];
    }

    // Also get general sides (not tied to specific meals) from the same chefs
    const meals = await Promise.all(
      args.mealIds.map((id) => ctx.db.get(id))
    );

    const chefIds = new Set<Id<'chefs'>>();
    meals.forEach((meal) => {
      if (meal?.chefId) {
        chefIds.add(meal.chefId);
      }
    });

    // Get general sides for these chefs (sides without a specific mealId)
    for (const chefId of chefIds) {
      const allChefSides = await ctx.db
        .query('sides')
        .withIndex('by_chef', (q) => q.eq('chefId', chefId))
        .collect();

      // Filter for available sides without a mealId
      const generalSides = allChefSides.filter((side) => {
        return side.available !== false && !side.mealId;
      });

      // Add to all meals from this chef
      meals.forEach((meal) => {
        if (meal?.chefId === chefId) {
          const mealId = meal._id;
          if (!result[mealId]) {
            result[mealId] = [];
          }
          // Avoid duplicates
          const existingIds = new Set(result[mealId].map((s: any) => s._id));
          generalSides.forEach((side) => {
            if (!existingIds.has(side._id)) {
              result[mealId].push(side);
            }
          });
        }
      });
    }

    return result;
  },
});

/**
 * Get all available sides (for general browsing)
 */
export const getAllAvailableSides = query({
  args: {
    category: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { category?: string; sessionToken?: string }) => {
    // Optional authentication
    await requireAuth(ctx, args.sessionToken).catch(() => {
      // Allow unauthenticated access
    });

    let query = ctx.db
      .query('sides')
      .filter((q) => q.eq(q.field('available'), true));

    if (args.category) {
      query = query.filter((q) => q.eq(q.field('category'), args.category));
    }

    return await query.collect();
  },
});

