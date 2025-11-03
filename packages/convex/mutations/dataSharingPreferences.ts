import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const updateByUserId = mutation({
  args: {
    userId: v.id('users'),
    analytics_enabled: v.optional(v.boolean()),
    personalization_enabled: v.optional(v.boolean()),
    marketing_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('dataSharingPreferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    const updates: any = {
      updated_at: Date.now(),
    };

    if (args.analytics_enabled !== undefined) {
      updates.analytics_enabled = args.analytics_enabled;
    }
    if (args.personalization_enabled !== undefined) {
      updates.personalization_enabled = args.personalization_enabled;
    }
    if (args.marketing_enabled !== undefined) {
      updates.marketing_enabled = args.marketing_enabled;
    }

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert('dataSharingPreferences', {
        userId: args.userId,
        analytics_enabled: args.analytics_enabled ?? true,
        personalization_enabled: args.personalization_enabled ?? true,
        marketing_enabled: args.marketing_enabled ?? false,
        updated_at: Date.now(),
      });
    }
  },
});

