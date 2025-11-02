import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    userId: v.id('users'),
    download_token: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for recent requests (rate limiting - max 1 per 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentRequests = await ctx.db
      .query('dataDownloads')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gt(q.field('requested_at'), oneDayAgo))
      .collect();

    if (recentRequests.length > 0) {
      throw new Error('Too many download requests. Maximum 1 per 24 hours.');
    }

    const downloadId = await ctx.db.insert('dataDownloads', {
      userId: args.userId,
      download_token: args.download_token,
      status: 'pending',
      expires_at: args.expires_at,
      requested_at: Date.now(),
    });

    return downloadId;
  },
});


