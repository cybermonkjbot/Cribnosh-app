import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { api } from '../_generated/api';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';

export const createOrderReview = mutation({
  args: {
    order_id: v.id('orders'),
    user_id: v.id('users'),
    rating: v.number(),
    review: v.optional(v.string()),
    categories: v.optional(
      v.object({
        food_quality: v.optional(v.number()),
        delivery_speed: v.optional(v.number()),
        packaging: v.optional(v.number()),
        customer_service: v.optional(v.number()),
      })
    ),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
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

    const orderStatus = order.order_status || (order as any).status;
    if (orderStatus !== 'delivered' && orderStatus !== 'completed') {
      throw new Error('Order must be delivered or completed to be rated');
    }

    // Check if already reviewed
    const existingReviews = await ctx.db
      .query('reviews')
      .filter((q) =>
        q.and(
          q.eq(q.field('user_id'), args.user_id),
          q.eq((q.field as any)('order_id'), args.order_id)
        )
      )
      .collect();

    if (existingReviews.length > 0) {
      throw new Error('Order has already been rated');
    }

    // Create review (assuming reviews table has order_id field)
    // If not, we may need to add it to the schema
    const reviewId = await ctx.db.insert('reviews', {
      user_id: args.user_id,
      chef_id: order.chef_id,
      rating: args.rating,
      comment: args.review,
      status: 'approved', // or 'pending' for moderation
      createdAt: Date.now(),
      order_id: args.order_id as any, // May need to be added to schema
      categories: args.categories,
    } as any);

    // Update order to mark as reviewed
    await ctx.db.patch(args.order_id, {
      reviewed_at: Date.now(),
      updatedAt: Date.now(),
    } as any);

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
  },
});

