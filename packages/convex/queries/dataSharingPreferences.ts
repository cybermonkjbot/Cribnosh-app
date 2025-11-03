import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query('dataSharingPreferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!preferences) {
      return {
        analytics_enabled: true,
        personalization_enabled: true,
        marketing_enabled: false,
        updated_at: new Date().toISOString(),
      };
    }

    return {
      analytics_enabled: preferences.analytics_enabled,
      personalization_enabled: preferences.personalization_enabled,
      marketing_enabled: preferences.marketing_enabled,
      updated_at: new Date(preferences.updated_at).toISOString(),
    };
  },
});

