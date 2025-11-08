import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';

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
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Users can only create reviews for themselves
    if (!isAdmin(user) && !isStaff(user) && args.user_id !== user._id) {
      throw new Error('Access denied');
    }
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
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Get review to check ownership
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Users can update their own reviews, staff/admin can update any
    // Only staff/admin can update status and approvalNotes
    if (args.status || args.approvalNotes) {
      if (!isAdmin(user) && !isStaff(user)) {
        throw new Error('Only staff/admin can update review status');
      }
    } else {
      // For other fields, check ownership
      if (!isAdmin(user) && !isStaff(user) && (review as any).user_id !== user._id) {
        throw new Error('Access denied');
      }
    }
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
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Get review to check ownership
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Users can delete their own reviews, staff/admin can delete any
    if (!isAdmin(user) && !isStaff(user) && (review as any).user_id !== user._id) {
      throw new Error('Access denied');
    }
    
    await ctx.db.delete(args.reviewId);
  },
});

/**
 * Create review with chef rating update - consolidates review creation and chef rating update
 * This mutation creates a review and immediately updates the chef's average rating
 */
export const createReviewWithChefRatingUpdate = mutation({
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
  returns: v.object({
    reviewId: v.id('reviews'),
    chefRatingUpdated: v.optional(v.boolean()),
    averageRating: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Users can only create reviews for themselves
    if (!isAdmin(user) && !isStaff(user) && args.user_id !== user._id) {
      throw new Error('Access denied');
    }
    // Create the review
    const reviewId = await ctx.db.insert('reviews', {
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

    // Update chef's average rating if chef_id is provided
    let chefRatingUpdated = false;
    let averageRating: number | undefined;
    
    if (args.chef_id) {
      try {
        const chef = await ctx.db.get(args.chef_id);
        if (chef) {
          // Get all reviews for this chef
          const reviews = await ctx.db
            .query('reviews')
            .filter((q) => q.eq(q.field('chef_id'), args.chef_id))
            .collect();

          if (reviews.length > 0) {
            // Calculate average rating
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            averageRating = totalRating / reviews.length;

            // Update chef rating and performance
            const currentPerformance = chef.performance || {
              totalOrders: 0,
              completedOrders: 0,
              averageRating: 0,
              totalEarnings: 0,
            };

            await ctx.db.patch(args.chef_id, {
              rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
              performance: {
                ...currentPerformance,
                averageRating: Math.round(averageRating * 10) / 10,
              },
              updatedAt: Date.now(),
            });

            chefRatingUpdated = true;
          }
        }
      } catch (error) {
        console.error('Failed to update chef rating:', error);
        // Continue - review is created, rating update can be retried
      }
    }

    return {
      reviewId,
      chefRatingUpdated,
      averageRating,
    };
  },
}); 