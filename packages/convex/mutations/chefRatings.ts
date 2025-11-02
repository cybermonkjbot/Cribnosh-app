import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const updateChefAverageRating = mutation({
  args: {
    chefId: v.id('chefs'),
  },
  handler: async (ctx, args) => {
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }

    // Get all reviews for this chef
    const reviews = await ctx.db
      .query('reviews')
      .filter((q) => q.eq(q.field('chef_id'), args.chefId))
      .collect();

    if (reviews.length === 0) {
      // No reviews yet, keep current rating or set to 0
      return { success: true, averageRating: chef.rating || 0 };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / reviews.length;

    // Update chef rating and performance
    const currentPerformance = chef.performance || {
      totalOrders: 0,
      completedOrders: 0,
      averageRating: 0,
      totalEarnings: 0,
    };

    await ctx.db.patch(args.chefId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      performance: {
        ...currentPerformance,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      updatedAt: Date.now(),
    });

    return { success: true, averageRating: Math.round(averageRating * 10) / 10 };
  },
});

