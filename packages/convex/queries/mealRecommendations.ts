// @ts-nocheck
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { query, QueryCtx } from '../_generated/server';
import { getPersonalizedMeals, getRecommendedMeals, getSimilarMeals, searchMealsBySemanticQuery } from '../utils/mealRecommendations';

/**
 * Get personalized meals for a user based on their preferences
 */
export const getPersonalized = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { userId: Id<'users'>; limit?: number }) => {
    const limit = args.limit || 20;
    return await getPersonalizedMeals(ctx, args.userId, limit);
  },
});

/**
 * Get recommended meals for a user based on preferences, likes, and follows
 */
export const getRecommended = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { userId: Id<'users'>; limit?: number }) => {
    const limit = args.limit || 10;
    return await getRecommendedMeals(ctx, args.userId, limit);
  },
});

/**
 * Get similar meals that respect user preferences
 */
export const getSimilar = query({
  args: {
    mealId: v.id('meals'),
    userId: v.optional(v.id('users')),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { mealId: Id<'meals'>; userId?: Id<'users'>; limit?: number }) => {
    const limit = args.limit || 5;
    return await getSimilarMeals(ctx, args.mealId, args.userId || null, limit);
  },
});

/**
 * Search meals using vector similarity search
 */
export const searchMealsByVector = query({
  args: {
    queryEmbedding: v.array(v.number()),
    limit: v.optional(v.number()),
    userId: v.optional(v.id('users')),
  },
  returns: v.array(v.any()),
  handler: async (ctx: QueryCtx, args: { queryEmbedding: number[]; limit?: number; userId?: Id<'users'> }) => {
    const limit = args.limit || 10;
    return await searchMealsBySemanticQuery(ctx, args.queryEmbedding, limit, args.userId);
  },
});

