// @ts-nocheck
import { v } from 'convex/values';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { mutation } from '../_generated/server';
import { isAdmin, isStaff, requireAuth } from '../utils/auth';

const categoriesValidator = v.object({
  food_quality: v.optional(v.number()),
  delivery_speed: v.optional(v.number()),
  packaging: v.optional(v.number()),
  customer_service: v.optional(v.number()),
});

const reviewArgs = {
  order_id: v.id('orders'),
  user_id: v.id('users'),
  rating: v.number(),
  review: v.optional(v.string()),
  categories: v.optional(categoriesValidator),
  sessionToken: v.optional(v.string())
};

const createOrderReviewHandler = async (ctx: any, args: any): Promise<Id<"reviews">> => {
  // Require authentication
  const user = await requireAuth(ctx, args.sessionToken);

  // Users can only create reviews for themselves
  if (!isAdmin(user) && !isStaff(user) && args.user_id !== user._id) {
    throw new Error('Access denied');
  }

  // Verify order belongs to user and is delivered/completed
  const order = await ctx.db.get(args.order_id);
  if (!order || order.customer_id !== args.user_id) {
    throw new Error('Order not found or not owned by user');
  }

  const orderStatus = order.order_status;
  if (orderStatus !== 'delivered' && orderStatus !== 'completed') {
    throw new Error('Order must be delivered or completed to be rated');
  }

  // Check if already reviewed
  const existingReview = await ctx.db
    .query('reviews')
    .withIndex('by_order', (q: any) => q.eq('order_id', args.order_id))
    .first();

  if (existingReview) {
    // If we found a review for this order, verify it's the same user (sanity check)
    if (existingReview.user_id === args.user_id) {
      throw new Error('Order has already been rated');
    }
    // If it's a different user, something is weird (order shared?), but for now assume one review per order
    throw new Error('Order has already been rated');
  }

  // Create review
  const reviewId = await ctx.db.insert('reviews', {
    user_id: args.user_id,
    chef_id: order.chef_id,
    rating: args.rating,
    comment: args.review,
    status: 'approved', // or 'pending' for moderation
    createdAt: Date.now(),
    order_id: args.order_id,
    categories: args.categories,
  });

  // Update order to mark as reviewed
  await ctx.db.patch(args.order_id, {
    reviewed_at: Date.now(),
    // updatedAt: Date.now(), // Field not present in schema
  });

  // Award Nosh Points (15 points for review written)
  await ctx.runMutation(api.mutations.noshPoints.addPoints, {
    userId: args.user_id,
    points: 15,
    reason: 'Review written',
    orderId: args.order_id,
  });

  // Update ForkPrint score (+25 points for review written)
  await ctx.runMutation(api.mutations.forkPrint.updateScore, {
    userId: args.user_id,
    pointsDelta: 25,
  });

  return reviewId;
};

export const createOrderReview = mutation({
  args: reviewArgs,
  handler: createOrderReviewHandler,
});
