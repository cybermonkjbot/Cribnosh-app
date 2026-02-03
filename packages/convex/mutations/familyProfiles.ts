// @ts-nocheck
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
    // New fields for creating allergies and dietary preferences
    allergies: v.optional(v.array(v.object({
      name: v.string(),
      type: v.union(v.literal('allergy'), v.literal('intolerance')),
      severity: v.union(v.literal('mild'), v.literal('moderate'), v.literal('severe')),
    }))),
    dietary_preferences: v.optional(v.object({
      preferences: v.array(v.string()),
      religious_requirements: v.array(v.string()),
      health_driven: v.array(v.string()),
    })),
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

    let allergyIds: Id<'allergies'>[] = [];
    let dietaryPreferenceId: Id<'dietaryPreferences'> | undefined = undefined;

    // Create allergies if provided
    if (args.allergies && args.allergies.length > 0) {
      // Delete existing allergies for this member
      const existingAllergies = await ctx.db
        .query('allergies')
        .withIndex('by_user', (q) => q.eq('userId', member.user_id!))
        .collect();

      for (const allergy of existingAllergies) {
        await ctx.db.delete(allergy._id);
      }

      // Create new allergies
      const now = Date.now();
      for (const allergy of args.allergies) {
        const id = await ctx.db.insert('allergies', {
          userId: member.user_id,
          name: allergy.name,
          type: allergy.type,
          severity: allergy.severity,
          created_at: now,
          updated_at: now,
        });
        allergyIds.push(id);
      }
    } else if (args.allergy_ids) {
      // Use provided allergy IDs
      allergyIds = args.allergy_ids;
    }

    // Create dietary preferences if provided
    if (args.dietary_preferences) {
      const existingDietaryPrefs = await ctx.db
        .query('dietaryPreferences')
        .withIndex('by_user', (q) => q.eq('userId', member.user_id!))
        .first();

      if (existingDietaryPrefs) {
        await ctx.db.patch(existingDietaryPrefs._id, {
          preferences: args.dietary_preferences.preferences,
          religious_requirements: args.dietary_preferences.religious_requirements,
          health_driven: args.dietary_preferences.health_driven,
          updated_at: Date.now(),
        });
        dietaryPreferenceId = existingDietaryPrefs._id;
      } else {
        dietaryPreferenceId = await ctx.db.insert('dietaryPreferences', {
          userId: member.user_id,
          preferences: args.dietary_preferences.preferences,
          religious_requirements: args.dietary_preferences.religious_requirements,
          health_driven: args.dietary_preferences.health_driven,
          updated_at: Date.now(),
        });
      }
    } else if (args.dietary_preference_id) {
      // Use provided dietary preference ID
      dietaryPreferenceId = args.dietary_preference_id;
    }

    // Update member in family profile
    const updatedMembers = profile.family_members.map((m) =>
      m.id === args.member_id
        ? {
            ...m,
            allergy_preferences: allergyIds.length > 0 ? allergyIds : m.allergy_preferences,
            dietary_preference_id: dietaryPreferenceId || m.dietary_preference_id,
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
      allergy_ids: allergyIds.length > 0 ? allergyIds : (existingPrefs?.allergy_ids || []),
      dietary_preference_id: dietaryPreferenceId || existingPrefs?.dietary_preference_id,
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

/**
 * Record order spending for a family member
 * This updates the budget tracking when a family member places an order
 */
export const recordOrderSpending = mutation({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_user_id: v.id('users'),
    order_amount: v.number(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      throw new Error('Family profile not found');
    }

    const member = profile.family_members.find((m) => m.user_id === args.member_user_id);
    if (!member) {
      throw new Error('Family member not found');
    }

    if (member.status !== 'accepted') {
      throw new Error('Member invitation not accepted');
    }

    const now = Date.now();
    const currency = args.currency || member.budget_settings?.currency || 'gbp';

    // Update daily budget if it exists
    if (member.budget_settings?.daily_limit !== undefined) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const dayStartTs = dayStart.getTime();

      const dailyBudget = await ctx.db
        .query('familyMemberBudgets')
        .withIndex('by_period', (q) =>
          q
            .eq('family_profile_id', args.family_profile_id)
            .eq('member_user_id', args.member_user_id)
            .eq('period_type', 'daily')
            .eq('period_start', dayStartTs)
        )
        .first();

      if (dailyBudget) {
        await ctx.db.patch(dailyBudget._id, {
          spent_amount: dailyBudget.spent_amount + args.order_amount,
          updated_at: now,
        });
      } else {
        await ctx.db.insert('familyMemberBudgets', {
          family_profile_id: args.family_profile_id,
          member_user_id: args.member_user_id,
          period_start: dayStartTs,
          period_type: 'daily',
          spent_amount: args.order_amount,
          limit_amount: member.budget_settings.daily_limit,
          currency,
          created_at: now,
        });
      }
    }

    // Update weekly budget if it exists
    if (member.budget_settings?.weekly_limit !== undefined) {
      const weekStart = new Date(now);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartTs = weekStart.getTime();

      const weeklyBudget = await ctx.db
        .query('familyMemberBudgets')
        .withIndex('by_period', (q) =>
          q
            .eq('family_profile_id', args.family_profile_id)
            .eq('member_user_id', args.member_user_id)
            .eq('period_type', 'weekly')
            .eq('period_start', weekStartTs)
        )
        .first();

      if (weeklyBudget) {
        await ctx.db.patch(weeklyBudget._id, {
          spent_amount: weeklyBudget.spent_amount + args.order_amount,
          updated_at: now,
        });
      } else {
        await ctx.db.insert('familyMemberBudgets', {
          family_profile_id: args.family_profile_id,
          member_user_id: args.member_user_id,
          period_start: weekStartTs,
          period_type: 'weekly',
          spent_amount: args.order_amount,
          limit_amount: member.budget_settings.weekly_limit,
          currency,
          created_at: now,
        });
      }
    }

    // Update monthly budget if it exists
    if (member.budget_settings?.monthly_limit !== undefined) {
      const monthStart = new Date(now);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartTs = monthStart.getTime();

      const monthlyBudget = await ctx.db
        .query('familyMemberBudgets')
        .withIndex('by_period', (q) =>
          q
            .eq('family_profile_id', args.family_profile_id)
            .eq('member_user_id', args.member_user_id)
            .eq('period_type', 'monthly')
            .eq('period_start', monthStartTs)
        )
        .first();

      if (monthlyBudget) {
        await ctx.db.patch(monthlyBudget._id, {
          spent_amount: monthlyBudget.spent_amount + args.order_amount,
          updated_at: now,
        });
      } else {
        await ctx.db.insert('familyMemberBudgets', {
          family_profile_id: args.family_profile_id,
          member_user_id: args.member_user_id,
          period_start: monthStartTs,
          period_type: 'monthly',
          spent_amount: args.order_amount,
          limit_amount: member.budget_settings.monthly_limit,
          currency,
          created_at: now,
        });
      }
    }

    return { success: true };
  },
});
