// @ts-nocheck
import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    userId: v.id('users'),
    deletion_will_complete_at: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if deletion already in progress
    const existing = await ctx.db
      .query('accountDeletions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'processing')
        )
      )
      .first();

    if (existing) {
      throw new Error('Account deletion already in progress');
    }

    const deletionId = await ctx.db.insert('accountDeletions', {
      userId: args.userId,
      deletion_requested_at: Date.now(),
      deletion_will_complete_at: args.deletion_will_complete_at,
      status: 'pending',
    });

    // Note: User status field doesn't support 'deletion_pending'
    // We'll store this in the accountDeletions table instead
    // If we need to mark user as pending deletion, we'd need to update the schema
    await ctx.db.patch(args.userId, {
      lastModified: Date.now(),
    });

    return deletionId;
  },
});

export const updateFeedback = mutation({
  args: {
    userId: v.id('users'),
    feedback_options: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const deletion = await ctx.db
      .query('accountDeletions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'processing')
        )
      )
      .first();

    if (!deletion) {
      throw new Error('No deletion request found');
    }

    await ctx.db.patch(deletion._id, {
      feedback_options: args.feedback_options,
    });

    return deletion._id;
  },
});

