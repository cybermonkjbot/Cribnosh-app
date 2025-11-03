import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    userId: v.id('users'),
    family_members: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        relationship: v.string(),
      })
    ),
    shared_payment_methods: v.boolean(),
    shared_orders: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query('familyProfiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      throw new Error('Family profile already exists');
    }

    const now = Date.now();
    const familyMembers = args.family_members.map((member, index) => ({
      id: `fm_${now}_${index}`,
      name: member.name,
      email: member.email,
      phone: member.phone,
      relationship: member.relationship,
      status: 'pending_invitation' as const,
      invited_at: now,
    }));

    const profileId = await ctx.db.insert('familyProfiles', {
      userId: args.userId,
      family_members: familyMembers,
      shared_payment_methods: args.shared_payment_methods,
      shared_orders: args.shared_orders,
      created_at: now,
    });

    return profileId;
  },
});

