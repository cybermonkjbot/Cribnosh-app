import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const updateByUserId = mutation({
  args: {
    userId: v.id('users'),
    allergies: v.array(
      v.object({
        name: v.string(),
        type: v.union(v.literal('allergy'), v.literal('intolerance')),
        severity: v.union(v.literal('mild'), v.literal('moderate'), v.literal('severe')),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete existing allergies
    const existing = await ctx.db
      .query('allergies')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const allergy of existing) {
      await ctx.db.delete(allergy._id);
    }

    // Create new allergies
    const now = Date.now();
    const allergyIds = [];
    for (const allergy of args.allergies) {
      const id = await ctx.db.insert('allergies', {
        userId: args.userId,
        name: allergy.name,
        type: allergy.type,
        severity: allergy.severity,
        created_at: now,
        updated_at: now,
      });
      allergyIds.push(id);
    }

    return allergyIds;
  },
});

