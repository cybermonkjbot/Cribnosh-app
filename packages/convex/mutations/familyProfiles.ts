import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

// Generate a random invitation token
function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const create = mutation({
  args: {
    userId: v.id('users'),
    family_members: v.optional(v.array(
      v.object({
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        relationship: v.string(),
        budget_settings: v.optional(v.object({
          daily_limit: v.optional(v.number()),
          weekly_limit: v.optional(v.number()),
          monthly_limit: v.optional(v.number()),
          currency: v.optional(v.string()),
        })),
      })
    )),
    shared_payment_methods: v.optional(v.boolean()),
    shared_orders: v.optional(v.boolean()),
    settings: v.optional(v.object({
      shared_payment_methods: v.boolean(),
      shared_orders: v.boolean(),
      allow_child_ordering: v.boolean(),
      require_approval_for_orders: v.boolean(),
      spending_notifications: v.boolean(),
    })),
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
    const familyMembers = (args.family_members || []).map((member, index) => ({
      id: `fm_${now}_${index}`,
      name: member.name,
      email: member.email,
      phone: member.phone,
      relationship: member.relationship,
      status: 'pending_invitation' as const,
      invited_at: now,
      invitation_token: generateInvitationToken(),
      budget_settings: member.budget_settings || undefined,
    }));

    const defaultSettings = {
      shared_payment_methods: args.shared_payment_methods ?? true,
      shared_orders: args.shared_orders ?? true,
      allow_child_ordering: true,
      require_approval_for_orders: false,
      spending_notifications: true,
    };

    const profileId = await ctx.db.insert('familyProfiles', {
      parent_user_id: args.userId,
      userId: args.userId,
      member_user_ids: [],
      family_members: familyMembers,
      settings: args.settings || defaultSettings,
      shared_payment_methods: args.shared_payment_methods ?? true, // Keep for backward compatibility
      shared_orders: args.shared_orders ?? true, // Keep for backward compatibility
      created_at: now,
    });

    return profileId;
  },
});

export const inviteMember = mutation({
  args: {
    family_profile_id: v.id('familyProfiles'),
    userId: v.id('users'), // Parent user ID
    member: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      relationship: v.string(),
      budget_settings: v.optional(v.object({
        daily_limit: v.optional(v.number()),
        weekly_limit: v.optional(v.number()),
        monthly_limit: v.optional(v.number()),
        currency: v.optional(v.string()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      throw new Error('Family profile not found');
    }

    if (profile.parent_user_id !== args.userId) {
      throw new Error('Only the parent can invite members');
    }

    const now = Date.now();
    const memberId = `fm_${now}_${Date.now()}`;
    const newMember = {
      id: memberId,
      name: args.member.name,
      email: args.member.email,
      phone: args.member.phone,
      relationship: args.member.relationship,
      status: 'pending_invitation' as const,
      invited_at: now,
      invitation_token: generateInvitationToken(),
      budget_settings: args.member.budget_settings || undefined,
    };

    await ctx.db.patch(args.family_profile_id, {
      family_members: [...profile.family_members, newMember],
      updated_at: now,
    });

    return { member_id: memberId, invitation_token: newMember.invitation_token };
  },
});

export const acceptInvitation = mutation({
  args: {
    invitation_token: v.string(),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Find the family profile with this invitation token
    const profiles = await ctx.db
      .query('familyProfiles')
      .collect();

    for (const profile of profiles) {
      const member = profile.family_members.find(
        (m) => m.invitation_token === args.invitation_token && m.status === 'pending_invitation'
      );

      if (member) {
        const now = Date.now();
        const updatedMembers = profile.family_members.map((m) =>
          m.id === member.id
            ? {
                ...m,
                status: 'accepted' as const,
                accepted_at: now,
                user_id: args.user_id,
              }
            : m
        );

        await ctx.db.patch(profile._id, {
          family_members: updatedMembers,
          member_user_ids: [...profile.member_user_ids, args.user_id],
          updated_at: now,
        });

        return { family_profile_id: profile._id, member_id: member.id };
      }
    }

    throw new Error('Invalid or expired invitation token');
  },
});

export const updateMemberBudget = mutation({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_id: v.string(),
    userId: v.id('users'), // Parent user ID
    budget_settings: v.object({
      daily_limit: v.optional(v.number()),
      weekly_limit: v.optional(v.number()),
      monthly_limit: v.optional(v.number()),
      currency: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      throw new Error('Family profile not found');
    }

    if (profile.parent_user_id !== args.userId) {
      throw new Error('Only the parent can update member budgets');
    }

    const member = profile.family_members.find((m) => m.id === args.member_id);
    if (!member) {
      throw new Error('Family member not found');
    }

    const updatedMembers = profile.family_members.map((m) =>
      m.id === args.member_id
        ? { ...m, budget_settings: args.budget_settings }
        : m
    );

    await ctx.db.patch(args.family_profile_id, {
      family_members: updatedMembers,
      updated_at: Date.now(),
    });

    // Update or create budget tracking entry
    const now = Date.now();
    const currency = args.budget_settings.currency || 'gbp';

    // Update daily budget if specified
    if (args.budget_settings.daily_limit !== undefined) {
      const dailyStart = new Date(now);
      dailyStart.setHours(0, 0, 0, 0);
      const dailyStartTs = dailyStart.getTime();

      const existingDaily = await ctx.db
        .query('familyMemberBudgets')
        .withIndex('by_period', (q) =>
          q
            .eq('family_profile_id', args.family_profile_id)
            .eq('member_user_id', member.user_id || ('' as Id<'users'>))
            .eq('period_type', 'daily')
            .eq('period_start', dailyStartTs)
        )
        .first();

      if (existingDaily) {
        await ctx.db.patch(existingDaily._id, {
          limit_amount: args.budget_settings.daily_limit,
          updated_at: now,
        });
      } else if (member.user_id) {
        await ctx.db.insert('familyMemberBudgets', {
          family_profile_id: args.family_profile_id,
          member_user_id: member.user_id,
          period_start: dailyStartTs,
          period_type: 'daily',
          spent_amount: 0,
          limit_amount: args.budget_settings.daily_limit,
          currency,
          created_at: now,
        });
      }
    }

    // Similar for weekly and monthly budgets
    if (args.budget_settings.weekly_limit !== undefined && member.user_id) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekStartTs = weekStart.getTime();

      const existingWeekly = await ctx.db
        .query('familyMemberBudgets')
        .withIndex('by_period', (q) =>
          q
            .eq('family_profile_id', args.family_profile_id)
            .eq('member_user_id', member.user_id)
            .eq('period_type', 'weekly')
            .eq('period_start', weekStartTs)
        )
        .first();

      if (existingWeekly) {
        await ctx.db.patch(existingWeekly._id, {
          limit_amount: args.budget_settings.weekly_limit,
          updated_at: now,
        });
      } else {
        await ctx.db.insert('familyMemberBudgets', {
          family_profile_id: args.family_profile_id,
          member_user_id: member.user_id,
          period_start: weekStartTs,
          period_type: 'weekly',
          spent_amount: 0,
          limit_amount: args.budget_settings.weekly_limit,
          currency,
          created_at: now,
        });
      }
    }

    if (args.budget_settings.monthly_limit !== undefined && member.user_id) {
      const monthStart = new Date(now);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartTs = monthStart.getTime();

      const existingMonthly = await ctx.db
        .query('familyMemberBudgets')
        .withIndex('by_period', (q) =>
          q
            .eq('family_profile_id', args.family_profile_id)
            .eq('member_user_id', member.user_id)
            .eq('period_type', 'monthly')
            .eq('period_start', monthStartTs)
        )
        .first();

      if (existingMonthly) {
        await ctx.db.patch(existingMonthly._id, {
          limit_amount: args.budget_settings.monthly_limit,
          updated_at: now,
        });
      } else {
        await ctx.db.insert('familyMemberBudgets', {
          family_profile_id: args.family_profile_id,
          member_user_id: member.user_id,
          period_start: monthStartTs,
          period_type: 'monthly',
          spent_amount: 0,
          limit_amount: args.budget_settings.monthly_limit,
          currency,
          created_at: now,
        });
      }
    }

    return { success: true };
  },
});

export const updateMemberPreferences = mutation({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_id: v.string(),
    userId: v.id('users'), // Parent user ID
    allergy_ids: v.optional(v.array(v.id('allergies'))),
    dietary_preference_id: v.optional(v.id('dietaryPreferences')),
    parent_controlled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      throw new Error('Family profile not found');
    }

    if (profile.parent_user_id !== args.userId) {
      throw new Error('Only the parent can update member preferences');
    }

    const member = profile.family_members.find((m) => m.id === args.member_id);
    if (!member) {
      throw new Error('Family member not found');
    }

    if (!member.user_id) {
      throw new Error('Member must have accepted invitation to update preferences');
    }

    // Update member in family profile
    const updatedMembers = profile.family_members.map((m) =>
      m.id === args.member_id
        ? {
            ...m,
            allergy_preferences: args.allergy_ids || m.allergy_preferences,
            dietary_preference_id: args.dietary_preference_id || m.dietary_preference_id,
          }
        : m
    );

    await ctx.db.patch(args.family_profile_id, {
      family_members: updatedMembers,
      updated_at: Date.now(),
    });

    // Update or create preferences entry
    const existingPrefs = await ctx.db
      .query('familyMemberPreferences')
      .withIndex('by_family_member', (q) =>
        q.eq('family_profile_id', args.family_profile_id).eq('member_user_id', member.user_id)
      )
      .first();

    const prefsData = {
      allergy_ids: args.allergy_ids || existingPrefs?.allergy_ids || [],
      dietary_preference_id: args.dietary_preference_id || existingPrefs?.dietary_preference_id,
      parent_controlled: args.parent_controlled ?? existingPrefs?.parent_controlled ?? true,
      updated_at: Date.now(),
    };

    if (existingPrefs) {
      await ctx.db.patch(existingPrefs._id, prefsData);
    } else {
      await ctx.db.insert('familyMemberPreferences', {
        family_profile_id: args.family_profile_id,
        member_user_id: member.user_id,
        ...prefsData,
        created_at: Date.now(),
      });
    }

    return { success: true };
  },
});

export const removeMember = mutation({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_id: v.string(),
    userId: v.id('users'), // Parent user ID
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      throw new Error('Family profile not found');
    }

    if (profile.parent_user_id !== args.userId) {
      throw new Error('Only the parent can remove members');
    }

    const member = profile.family_members.find((m) => m.id === args.member_id);
    if (!member) {
      throw new Error('Family member not found');
    }

    const updatedMembers = profile.family_members.map((m) =>
      m.id === args.member_id ? { ...m, status: 'removed' as const } : m
    );

    const updatedMemberUserIds = member.user_id
      ? profile.member_user_ids.filter((id) => id !== member.user_id)
      : profile.member_user_ids;

    await ctx.db.patch(args.family_profile_id, {
      family_members: updatedMembers,
      member_user_ids: updatedMemberUserIds,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const updateSettings = mutation({
  args: {
    family_profile_id: v.id('familyProfiles'),
    userId: v.id('users'), // Parent user ID
    settings: v.object({
      shared_payment_methods: v.boolean(),
      shared_orders: v.boolean(),
      allow_child_ordering: v.boolean(),
      require_approval_for_orders: v.boolean(),
      spending_notifications: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      throw new Error('Family profile not found');
    }

    if (profile.parent_user_id !== args.userId) {
      throw new Error('Only the parent can update settings');
    }

    await ctx.db.patch(args.family_profile_id, {
      settings: args.settings,
      shared_payment_methods: args.settings.shared_payment_methods, // Keep for backward compatibility
      shared_orders: args.settings.shared_orders, // Keep for backward compatibility
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const transferOwnership = mutation({
  args: {
    family_profile_id: v.id('familyProfiles'),
    current_user_id: v.id('users'), // Current parent
    new_parent_user_id: v.id('users'), // New parent
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      throw new Error('Family profile not found');
    }

    if (profile.parent_user_id !== args.current_user_id) {
      throw new Error('Only the current parent can transfer ownership');
    }

    // Verify new parent is a member
    if (!profile.member_user_ids.includes(args.new_parent_user_id)) {
      throw new Error('New parent must be an accepted family member');
    }

    // Update parent and move old parent to members
    const updatedMemberUserIds = profile.member_user_ids.filter(
      (id) => id !== args.new_parent_user_id
    );
    updatedMemberUserIds.push(args.current_user_id);

    await ctx.db.patch(args.family_profile_id, {
      parent_user_id: args.new_parent_user_id,
      userId: args.new_parent_user_id, // Keep for backward compatibility
      member_user_ids: updatedMemberUserIds,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
