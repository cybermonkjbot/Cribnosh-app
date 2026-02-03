// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const allergies = await ctx.db
      .query('allergies')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    return allergies.map((allergy) => ({
      id: allergy._id,
      name: allergy.name,
      type: allergy.type,
      severity: allergy.severity,
      created_at: new Date(allergy.created_at).toISOString(),
    }));
  },
});

