import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory,
  ErrorCode
} from '../../../apps/web/lib/errors/convex-exports';
import { api } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * Initialize profile tracking records for a new user
 */
async function initializeUserProfile(ctx: MutationCtx, userId: Id<'users'>) {
  // Initialize Nosh Points (0 points)
  await ctx.runMutation(api.mutations.noshPoints.initializePoints, {
    userId,
  });

  // Initialize ForkPrint score (0 score)
  await ctx.runMutation(api.mutations.forkPrint.updateScore, {
    userId,
    pointsDelta: 0,
  });

  // Initialize nutrition goal (2000 calories/day)
  await ctx.runMutation(api.mutations.nutrition.setNutritionGoal, {
    userId,
    dailyGoal: 2000,
    goalType: 'daily',
  });

  // Initialize streak (0 streak)
  await ctx.runMutation(api.mutations.streaks.initializeStreak, {
    userId,
  });
}

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(), // Already hashed
    roles: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
  },
  returns: v.id("users"),
  handler: async (ctx: MutationCtx, args) => {
    // Check if user already exists (unique by email)
    const existing = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();
    if (existing) throw ErrorFactory.conflict('A user with this email already exists.');
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: args.password, // Already hashed
      roles: args.roles ?? ["user"],
      status: args.status ?? "active",
      lastModified: Date.now(),
    });

    // Initialize profile tracking records
    await initializeUserProfile(ctx, userId);

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    password: v.optional(v.string()), // Already hashed if present
    roles: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
    preferences: v.optional(v.object({
      cuisine: v.optional(v.array(v.string())),
      dietary: v.optional(v.array(v.string())),
    })),
    avatar: v.optional(v.string()),
    oauthProviders: v.optional(v.array(v.object({
      provider: v.union(v.literal('google'), v.literal('apple')),
      providerId: v.string(),
      email: v.string(),
      name: v.string(),
      picture: v.optional(v.string()),
      verified: v.boolean(),
    }))),
    primaryOAuthProvider: v.optional(v.union(v.literal('google'), v.literal('apple'))),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { userId, ...updates } = args;
    // Check if email is being updated and if it's already taken
    if (updates.email) {
      const existing = await ctx.db
        .query('users')
        .filter(q => q.eq(q.field('email'), updates.email))
        .filter(q => q.neq(q.field('_id'), userId))
        .first();
      if (existing) throw ErrorFactory.conflict('A user with this email already exists.');
    }
    await ctx.db.patch(userId, {
      ...updates,
      lastModified: Date.now(),
    });
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.delete(args.userId);
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.patch(args.userId, {
      status: args.status,
    });
  },
});

export const updateUserRoles = mutation({
  args: {
    userId: v.id("users"),
    roles: v.array(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.patch(args.userId, {
      roles: args.roles,
      lastModified: Date.now(),
    });
  },
});

export const updateLastLogin = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.patch(args.userId, {
      lastLogin: Date.now(),
    });
  },
});

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(), // Already hashed
    roles: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
  },
  returns: v.id("users"),
  handler: async (ctx: MutationCtx, args) => {
    // Only allow 'staff' if caller is admin
    if (args.roles && args.roles.includes("staff")) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || !identity.tokenIdentifier) {
        throw new Error("Not authenticated");
      }
      // Get the current user's email from the token
      const email = identity.tokenIdentifier.split(':')[1];
      const user = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', email))
        .first();
      if (!user || !user.roles || !user.roles.includes("admin")) {
        throw new Error("Only admins can create users with the 'staff' role.");
      }
    }
    // Check if user already exists (unique by email)
    const existing = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();
    if (existing) throw ErrorFactory.conflict('A user with this email already exists.');
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: args.password, // Already hashed
      roles: args.roles ?? ["user"],
      status: args.status ?? "active",
      lastModified: Date.now(),
    });
    return userId;
  },
});

// Additional mutations for admin functionality
export const bulkUpdateUserStatus = mutation({
  args: {
    userIds: v.array(v.id("users")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    for (const userId of args.userIds) {
      await ctx.db.patch(userId, {
        status: args.status,
        lastModified: Date.now(),
      });
    }
  },
});

export const bulkUpdateUserRoles = mutation({
  args: {
    userIds: v.array(v.id("users")),
    roles: v.array(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    for (const userId of args.userIds) {
      await ctx.db.patch(userId, {
        roles: args.roles,
        lastModified: Date.now(),
      });
    }
  },
});

export const deleteMultipleUsers = mutation({
  args: {
    userIds: v.array(v.id("users")),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    for (const userId of args.userIds) {
      await ctx.db.delete(userId);
    }
  },
});

export const getUserStats = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const users = await ctx.db.query("users").collect();
    const activeUsers = users.filter(user => user.status === 'active');
    const inactiveUsers = users.filter(user => user.status === 'inactive');
    const suspendedUsers = users.filter(user => user.status === 'suspended');
    
    return {
      total: users.length,
      active: activeUsers.length,
      inactive: inactiveUsers.length,
      suspended: suspendedUsers.length,
      recentLogins: users.filter(user => user.lastLogin && Date.now() - user.lastLogin < 7 * 24 * 60 * 60 * 1000).length,
    };
  },
});

export const searchUsers = mutation({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: MutationCtx, args) => {
    const users = await ctx.db.query("users").collect();
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(args.query.toLowerCase()) ||
      user.email.toLowerCase().includes(args.query.toLowerCase())
    );
    
    return filtered.slice(0, args.limit || 10);
  },
});

// Add isAdminUser utility for role check
function isAdminUser(obj: any): boolean {
  return obj && Array.isArray(obj.roles) && obj.roles.includes('admin');
}

export const updateUserOnboarding = mutation({
  args: {
    userId: v.id("users"),
    onboarding: v.any(),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.patch(args.userId, {
      onboarding: args.onboarding,
      lastModified: Date.now(),
    });
  },
});

export const updateMattermostStatus = mutation({
  args: { email: v.string(), mattermostActive: v.boolean(), mattermostProfile: v.optional(v.any()), mattermostUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db.query('users').filter(q => q.eq(q.field('email'), args.email)).first();
    if (!user) throw ErrorFactory.conflict('User not found');
    await ctx.db.patch(user._id, { mattermostActive: args.mattermostActive, mattermostProfile: args.mattermostProfile, ...(args.mattermostUserId ? { mattermostUserId: args.mattermostUserId } : {}) });
    return true;
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const createNotification = mutation({
  args: {
    userId: v.optional(v.id("users")),
    type: v.string(),
    message: v.string(),
    global: v.optional(v.boolean()),
    roles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      message: args.message,
      read: false,
      createdAt: Date.now(),
      global: args.global ?? false,
      roles: args.roles || [],
    });
  },
});

export const generateReferralLink = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.string(),
  handler: async (ctx: MutationCtx, args) => {
    // Generate a unique referral code (could be userId or a hash)
    const referralCode = args.userId;
    const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL || "https://cribnosh.com"}/waitlist?ref=${referralCode}`;
    await ctx.db.patch(args.userId, {
      referralLink,
    });
    return referralLink;
  },
});

export const attributeReferral = mutation({
  args: {
    newUserId: v.id("users"),
    referrerId: v.id("users"),
    deviceId: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Check for unique signup by device/IP using indexes
    let existingReferral = null as any;
    if (args.deviceId && args.ip) {
      existingReferral = await ctx.db
        .query("referrals")
        .withIndex("by_referrer_device_ip", (q) =>
          q
            .eq("referrerId", args.referrerId)
            .eq("deviceId", args.deviceId!)
            .eq("ip", args.ip!)
        )
        .first();
    } else if (args.deviceId) {
      existingReferral = await ctx.db
        .query("referrals")
        .withIndex("by_referrer_and_device", (q) =>
          q.eq("referrerId", args.referrerId).eq("deviceId", args.deviceId!)
        )
        .first();
    } else {
      existingReferral = await ctx.db
        .query("referrals")
        .withIndex("by_referrer", (q) => q.eq("referrerId", args.referrerId))
        .first();
    }
    if (existingReferral) {
      throw new Error("Referral already attributed from this device or IP.");
    }
    // Create referral event
    const referralId = await ctx.db.insert("referrals", {
      referrerId: args.referrerId,
      referredUserId: args.newUserId,
      referralCode: args.referrerId,
      createdAt: Date.now(),
      completedAt: Date.now(),
      deviceId: args.deviceId,
      ip: args.ip,
      status: "completed",
    });
    // Update new user with referrerId and referralHistory
    await ctx.db.patch(args.newUserId, {
      referrerId: args.referrerId,
      referralHistory: [referralId],
    });
    // Increment referrer's referralCount and add to referralHistory
    const referrer = await ctx.db.get(args.referrerId);
    if (!referrer) {
      throw new Error("Referrer not found.");
    }
    const newCount = (referrer.referralCount || 0) + 1;
    const refHistory = referrer.referralHistory || [];
    await ctx.db.patch(args.referrerId, {
      referralCount: newCount,
      referralHistory: [...refHistory, referralId],
    });
    // Reward logic (tiers)
    const rewards = referrer.rewards || {};
    let rewardTier: string | undefined = undefined;
    if (newCount === 1) {
      rewards.noshCredit = (rewards.noshCredit || 0) + 500;
      rewards.earlyAccess = true;
      rewardTier = "1";
    } else if (newCount === 3) {
      rewards.deliveryDiscount = true;
      rewards.badge = "3-referrals";
      rewardTier = "3";
    } else if (newCount === 5) {
      rewards.skipWaitlist = true;
      rewards.leaderboard = true;
      rewardTier = "5";
    } else if (newCount === 10) {
      rewards.noshCredit = (rewards.noshCredit || 0) + 5000;
      rewards.featured = true;
      rewardTier = "10";
    } else if (newCount >= 20) {
      rewards.affiliate = true;
      rewards.commissionMode = true;
      rewardTier = "20";
    }
    await ctx.db.patch(args.referrerId, {
      rewards,
      affiliateStatus: newCount >= 20 ? "active" : referrer.affiliateStatus || "none",
    });
    // Update referral event with rewardTier
    await ctx.db.patch(referralId, { rewardTier });
    return { referralId, rewardTier, newCount };
  },
});

export const getReferralLeaderboard = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const users = await ctx.db.query("users").collect();
    const sorted = users
      .filter(u => u.referralCount && u.referralCount > 0)
      .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
    const top = sorted.slice(0, args.limit || 10).map(u => ({
      name: u.name,
      avatar: u.avatar,
      forkprint: u.referralCount || 0,
      userId: u._id,
    }));
    return top;
  },
});

export const getUserReferralStats = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    return {
      referralCount: user.referralCount || 0,
      rewards: user.rewards || {},
      affiliateStatus: user.affiliateStatus || "none",
      referralLink: user.referralLink || null,
      referralHistory: user.referralHistory || [],
    };
  },
});

export const createMinimalUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx: MutationCtx, args) => {
    // Check if user already exists (unique by email)
    const existing = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();
    if (existing) return existing._id;
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: '',
      status: 'active',
      lastModified: Date.now(),
    });
    return userId;
  },
});

export const setSessionToken = mutation({
  args: {
    userId: v.id("users"),
    sessionToken: v.string(),
    sessionExpiry: v.number(),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.patch(args.userId, {
      sessionToken: args.sessionToken,
      sessionExpiry: args.sessionExpiry,
      lastModified: Date.now(),
    });
  },
});

export const applyReferralReward = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw ErrorFactory.conflict('User not found');
    const rewards = user.rewards || {};
    rewards.noshCredit = (rewards.noshCredit || 0) + 500;
    rewards.referralUsed = true;
    await ctx.db.patch(args.userId, { rewards });
    return { success: true };
  },
});

export const setReferralProgramActive = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { referralProgramActive: true });
    return { success: true };
  },
});

export const markAllNotificationsRead = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const notifs = await ctx.db.query('notifications').withIndex('by_user', q => q.eq('userId', args.userId)).collect();
    for (const notif of notifs) {
      if (!notif.read) {
        await ctx.db.patch(notif._id, { read: true });
      }
    }
    return { status: 'ok', count: notifs.length };
  }
});

export const setStripeCustomerId = mutation({
  args: { userId: v.id("users"), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { stripeCustomerId: args.stripeCustomerId });
  },
});

// Update subscription status for Stripe webhooks
export const updateSubscriptionStatus = mutation({
  args: { 
    userId: v.id("users"), 
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("pending"),
      v.literal("inactive"),
      v.literal("suspended")
    )
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { 
      status: args.subscriptionStatus === 'canceled' ? 'inactive' : 'active',
      lastModified: Date.now()
    });
  },
});

export const createOrUpdateOAuthUser = mutation({
  args: {
    provider: v.union(v.literal('google'), v.literal('apple')),
    providerId: v.string(),
    email: v.string(),
    name: v.string(),
    picture: v.optional(v.string()),
    verified: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const now = Date.now();
    
    // Check if user already exists by OAuth provider ID
    const allUsers = await ctx.db.query('users').collect();
    const existingUser = allUsers.find(user => 
      user.oauthProviders?.some(oauth => 
        oauth.provider === args.provider && 
        oauth.providerId === args.providerId
      )
    );
    
    if (existingUser) {
      // Update existing user's OAuth info
      const updatedOAuthProviders = existingUser.oauthProviders?.map(oauth => 
        oauth.provider === args.provider 
          ? { ...oauth, ...args, verified: args.verified ?? true }
          : oauth
      ) || [{ ...args, verified: args.verified ?? true }];
      
      await ctx.db.patch(existingUser._id, {
        oauthProviders: updatedOAuthProviders,
        primaryOAuthProvider: args.provider,
        lastModified: now,
        lastLogin: now,
      });
      
      return { userId: existingUser._id, isNewUser: false };
    }
    
    // Check if user exists by email
    const userByEmail = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();
    
    if (userByEmail) {
      // Link OAuth to existing account
      const updatedOAuthProviders = [
        ...(userByEmail.oauthProviders || []),
        { ...args, verified: args.verified ?? true }
      ];
      
      await ctx.db.patch(userByEmail._id, {
        oauthProviders: updatedOAuthProviders,
        primaryOAuthProvider: args.provider,
        lastModified: now,
        lastLogin: now,
      });
      
      return { userId: userByEmail._id, isNewUser: false };
    }
    
    // Create new user
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: '', // No password for OAuth users
      roles: ['customer'],
      status: 'active',
      oauthProviders: [{ ...args, verified: args.verified ?? true }],
      primaryOAuthProvider: args.provider,
      lastModified: now,
      lastLogin: now,
    });

    // Initialize profile tracking records for new user
    await initializeUserProfile(ctx, userId);
    
    return { userId, isNewUser: true };
  },
});
