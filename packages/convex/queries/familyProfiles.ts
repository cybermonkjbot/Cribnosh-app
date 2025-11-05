import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Try to find as parent first
    let profile = await ctx.db
      .query('familyProfiles')
      .withIndex('by_parent_user', (q) => q.eq('parent_user_id', args.userId))
      .first();

    // If not found as parent, try as member
    if (!profile) {
      const allProfiles = await ctx.db.query('familyProfiles').collect();
      profile = allProfiles.find((p) => p.member_user_ids.includes(args.userId));
    }

    // Also check by userId for backward compatibility
    if (!profile) {
      profile = await ctx.db
        .query('familyProfiles')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .first();
    }

    return profile || null;
  },
});

export const getMemberBudgets = query({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_user_id: v.id('users'),
    period_type: v.optional(v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let periodStart: number;

    if (args.period_type === 'daily') {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      periodStart = dayStart.getTime();
    } else if (args.period_type === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      periodStart = weekStart.getTime();
    } else if (args.period_type === 'monthly') {
      const monthStart = new Date(now);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      periodStart = monthStart.getTime();
    } else {
      // Get all periods
      const budgets = await ctx.db
        .query('familyMemberBudgets')
        .withIndex('by_family_profile', (q) => q.eq('family_profile_id', args.family_profile_id))
        .filter((q) => q.eq(q.field('member_user_id'), args.member_user_id))
        .collect();

      return budgets;
    }

    const budget = await ctx.db
      .query('familyMemberBudgets')
      .withIndex('by_period', (q) =>
        q
          .eq('family_profile_id', args.family_profile_id)
          .eq('member_user_id', args.member_user_id)
          .eq('period_type', args.period_type || 'daily')
          .eq('period_start', periodStart)
      )
      .first();

    return budget || null;
  },
});

export const getMemberPreferences = query({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query('familyMemberPreferences')
      .withIndex('by_family_member', (q) =>
        q.eq('family_profile_id', args.family_profile_id).eq('member_user_id', args.member_user_id)
      )
      .first();

    if (!preferences) {
      return null;
    }

    // Fetch allergy details
    const allergies = await Promise.all(
      preferences.allergy_ids.map(async (allergyId) => {
        const allergy = await ctx.db.get(allergyId);
        return allergy;
      })
    );

    // Fetch dietary preference details
    let dietaryPreference = null;
    if (preferences.dietary_preference_id) {
      dietaryPreference = await ctx.db.get(preferences.dietary_preference_id);
    }

    return {
      ...preferences,
      allergies: allergies.filter((a) => a !== null),
      dietary_preference: dietaryPreference,
    };
  },
});

export const getFamilyOrders = query({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_user_id: v.optional(v.id('users')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      return [];
    }

    const memberUserIds = args.member_user_id
      ? [args.member_user_id]
      : profile.member_user_ids;

    // Get all orders for family members
    const allOrders = await ctx.db.query('orders').collect();

    const familyOrders = allOrders
      .filter((order) => {
        // Check if order was placed by a family member
        const orderUserId = (order as any).userId || (order as any).user_id;
        return (
          orderUserId &&
          (orderUserId === profile.parent_user_id || memberUserIds.includes(orderUserId as Id<'users'>))
        );
      })
      .sort((a, b) => {
        const aTime = (a as any).createdAt || (a as any).created_at || 0;
        const bTime = (b as any).createdAt || (b as any).created_at || 0;
        return bTime - aTime;
      })
      .slice(0, args.limit || 50);

    return familyOrders;
  },
});

export const checkBudgetAllowance = query({
  args: {
    family_profile_id: v.id('familyProfiles'),
    member_user_id: v.id('users'),
    order_amount: v.number(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.family_profile_id);
    if (!profile) {
      return { allowed: false, reason: 'Family profile not found' };
    }

    const member = profile.family_members.find((m) => m.user_id === args.member_user_id);
    if (!member) {
      return { allowed: false, reason: 'Family member not found' };
    }

    if (member.status !== 'accepted') {
      return { allowed: false, reason: 'Member invitation not accepted' };
    }

    const budgetSettings = member.budget_settings;
    if (!budgetSettings) {
      return { allowed: true, reason: 'No budget limits set' };
    }

    const now = Date.now();
    const currency = args.currency || budgetSettings.currency || 'gbp';

    // Check daily budget
    if (budgetSettings.daily_limit !== undefined) {
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

      const dailySpent = dailyBudget?.spent_amount || 0;
      const dailyLimit = budgetSettings.daily_limit;

      if (dailySpent + args.order_amount > dailyLimit) {
        return {
          allowed: false,
          reason: `Exceeds daily budget limit of ${dailyLimit} ${currency.toUpperCase()}`,
          daily_spent: dailySpent,
          daily_limit: dailyLimit,
          remaining: dailyLimit - dailySpent,
        };
      }
    }

    // Check weekly budget
    if (budgetSettings.weekly_limit !== undefined) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
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

      const weeklySpent = weeklyBudget?.spent_amount || 0;
      const weeklyLimit = budgetSettings.weekly_limit;

      if (weeklySpent + args.order_amount > weeklyLimit) {
        return {
          allowed: false,
          reason: `Exceeds weekly budget limit of ${weeklyLimit} ${currency.toUpperCase()}`,
          weekly_spent: weeklySpent,
          weekly_limit: weeklyLimit,
          remaining: weeklyLimit - weeklySpent,
        };
      }
    }

    // Check monthly budget
    if (budgetSettings.monthly_limit !== undefined) {
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

      const monthlySpent = monthlyBudget?.spent_amount || 0;
      const monthlyLimit = budgetSettings.monthly_limit;

      if (monthlySpent + args.order_amount > monthlyLimit) {
        return {
          allowed: false,
          reason: `Exceeds monthly budget limit of ${monthlyLimit} ${currency.toUpperCase()}`,
          monthly_spent: monthlySpent,
          monthly_limit: monthlyLimit,
          remaining: monthlyLimit - monthlySpent,
        };
      }
    }

    return {
      allowed: true,
      reason: 'Within budget limits',
    };
  },
});
