import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    user_id: v.id('users'),
    meal_id: v.optional(v.id('meals')),
    chef_id: v.optional(v.id('chefs')),
    order_id: v.optional(v.id('orders')),
    rating: v.number(),
    comment: v.optional(v.string()),
    categories: v.optional(v.object({
      food_quality: v.optional(v.number()),
      delivery_speed: v.optional(v.number()),
      packaging: v.optional(v.number()),
      customer_service: v.optional(v.number()),
    })),
    status: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('reviews', {
      user_id: args.user_id,
      meal_id: args.meal_id,
      chef_id: args.chef_id,
      order_id: args.order_id,
      rating: args.rating,
      comment: args.comment,
      categories: args.categories,
      status: args.status,
      createdAt: args.createdAt,
    });
  },
});

export const updateReview = mutation({
  args: {
    reviewId: v.id('reviews'),
    rating: v.optional(v.number()),
    comment: v.optional(v.string()),
    status: v.optional(v.string()),
    approvalNotes: v.optional(v.string()),
    sentiment: v.optional(v.any()),
    analyzedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reviewId, {
      ...(args.rating !== undefined ? { rating: args.rating } : {}),
      ...(args.comment !== undefined ? { comment: args.comment } : {}),
      ...(args.status !== undefined ? { status: args.status } : {}),
      ...(args.approvalNotes !== undefined ? { approvalNotes: args.approvalNotes } : {}),
      ...(args.sentiment !== undefined ? { sentiment: args.sentiment } : {}),
      ...(args.analyzedAt !== undefined ? { analyzedAt: args.analyzedAt } : {}),
    });
  },
});

export const deleteReview = mutation({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reviewId);
  },
}); 