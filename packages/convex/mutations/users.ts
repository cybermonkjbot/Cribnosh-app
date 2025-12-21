import { v } from 'convex/values';
import {
  ErrorFactory
} from '../../../apps/web/lib/errors/convex-exports';
import { Id } from '../_generated/dataModel';
import { internalMutation, mutation, MutationCtx } from '../_generated/server';
import { isAdmin, isStaff, requireAdmin, requireAuth, requireStaff } from '../utils/auth';

/**
 * Initialize profile tracking records for a new user
 * Errors are caught and logged but don't fail user creation
 */
async function initializeUserProfile(ctx: MutationCtx, userId: Id<'users'>) {
  // TODO: Refactor these into internal functions that take MutationCtx
  // so they can be called directly from mutations.
  // MutationCtx does not support runMutation.

  /*
  try {
    // Initialize Nosh Points (0 points)
    await ctx.runMutation(api.mutations.noshPoints.initializePoints, {
      userId,
    });
  } catch (error) {
    console.error('Failed to initialize Nosh Points:', error);
  }

  try {
    // Initialize ForkPrint score (0 score)
    await ctx.runMutation(api.mutations.forkPrint.updateScore, {
      userId,
      pointsDelta: 0,
    });
  } catch (error) {
    console.error('Failed to initialize ForkPrint score:', error);
  }

  try {
    // Initialize nutrition goal (2000 calories/day)
    await ctx.runMutation(api.mutations.nutrition.setNutritionGoal, {
      userId,
      dailyGoal: 2000,
      goalType: 'daily',
    });
  } catch (error) {
    console.error('Failed to initialize nutrition goal:', error);
  }

  try {
    // Initialize streak (0 streak)
    await ctx.runMutation(api.mutations.streaks.initializeStreak, {
      userId,
    });
  } catch (error) {
    console.error('Failed to initialize streak:', error);
  }
  */
  console.log('Profile initialization deferred for user:', userId);
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
    address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    })),
    oauthProviders: v.optional(v.array(v.object({
      provider: v.union(v.literal('google'), v.literal('apple')),
      providerId: v.string(),
      email: v.string(),
      name: v.string(),
      picture: v.optional(v.string()),
      verified: v.boolean(),
    }))),
    primaryOAuthProvider: v.optional(v.union(v.literal('google'), v.literal('apple'))),
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can update their own data, but only admins can update roles/status
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }

    // Only admins can update roles or status
    if ((args.roles || args.status) && !isAdmin(user)) {
      throw new Error('Only admins can update roles or status');
    }

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

export const setupTwoFactor = mutation({
  args: {
    userId: v.id("users"),
    secret: v.string(), // Encrypted secret
    backupCodes: v.array(v.string()), // Hashed backup codes
    sessionToken: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can only set up 2FA for themselves
    if (!isAdmin(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    const { userId, secret, backupCodes } = args;
    await ctx.db.patch(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
      lastModified: Date.now(),
    });
    return true;
  },
});

export const disableTwoFactor = mutation({
  args: {
    userId: v.id("users"),
    sessionToken: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can only disable 2FA for themselves, admins can disable for anyone
    if (!isAdmin(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    const { userId } = args;
    await ctx.db.patch(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: undefined,
      lastModified: Date.now(),
    });
    return true;
  },
});

export const verifyTwoFactorCode = mutation({
  args: {
    userId: v.id("users"),
    code: v.string(),
    isValid: v.boolean(), // Passed from API route which has otplib access
    sessionToken: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const authUser = await requireAuth(ctx, args.sessionToken);

    // Users can only verify 2FA for themselves
    if (!isAdmin(authUser) && args.userId !== authUser._id) {
      throw new Error('Access denied');
    }
    const { userId, code, isValid } = args;
    const targetUser = await ctx.db.get(userId);
    if (!targetUser || !targetUser.twoFactorEnabled || !targetUser.twoFactorSecret) {
      return false;
    }

    if (!isValid) {
      return false;
    }

    // If code is valid and it's a backup code, remove it from the list
    if (targetUser.twoFactorBackupCodes && targetUser.twoFactorBackupCodes.length > 0) {
      // Check if code matches any backup code (this check was done in API route)
      // Remove the used backup code
      const updatedCodes = targetUser.twoFactorBackupCodes.filter((hashedCode: string) => {
        // We'll identify which backup code was used in the API route
        // For now, just remove one code if it was a backup code
        // This is a simplified approach - the API route will handle the actual verification
        return true; // Keep all codes for now, API route handles removal
      });

      // Note: Backup code removal is handled in the API route after verification
    }

    return true;
  },
});

export const removeBackupCode = mutation({
  args: {
    userId: v.id("users"),
    hashedCode: v.string(),
    sessionToken: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const authUser = await requireAuth(ctx, args.sessionToken);

    // Users can only remove backup codes for themselves
    if (!isAdmin(authUser) && args.userId !== authUser._id) {
      throw new Error('Access denied');
    }
    const { userId, hashedCode } = args;
    const targetUser = await ctx.db.get(userId);
    if (!targetUser || !targetUser.twoFactorBackupCodes) {
      return false;
    }

    const updatedCodes = targetUser.twoFactorBackupCodes.filter((code: string) => code !== hashedCode);
    await ctx.db.patch(userId, {
      twoFactorBackupCodes: updatedCodes,
      lastModified: Date.now(),
    });

    return true;
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);

    await ctx.db.delete(args.userId);
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);

    await ctx.db.patch(args.userId, {
      status: args.status,
    });
  },
});

export const updateUserRoles = mutation({
  args: {
    userId: v.id("users"),
    roles: v.array(v.string()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);

    await ctx.db.patch(args.userId, {
      roles: args.roles,
      lastModified: Date.now(),
    });
  },
});

/**
 * Internal mutation to update user roles without authentication
 * Used during sign-in flows when user doesn't have a session token yet
 */
export const _updateUserRolesInternal = internalMutation({
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
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
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
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
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
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    for (const userId of args.userIds) {
      await ctx.db.delete(userId);
    }
  },
});

export const getUserStats = mutation({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
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
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx: MutationCtx, args) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
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
    sessionToken: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can update their own onboarding, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
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
  args: {
    notificationId: v.id("notifications"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get notification to check ownership
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Users can mark their own notifications as read, staff/admin can mark any
    if (notification.userId && !isAdmin(user) && !isStaff(user) && notification.userId !== user._id) {
      throw new Error('Access denied');
    }

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
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // If creating global notification or notification for other users, require staff/admin
    if (args.global || (args.userId && args.userId !== user._id)) {
      if (!isAdmin(user) && !isStaff(user)) {
        throw new Error('Access denied');
      }
    }
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
    sessionToken: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can generate referral links for themselves
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
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

/**
 * Create or update user with roles - ensures customer role and returns full user
 * This consolidates user creation/update and role assignment into a single mutation
 */
export const createOrUpdateUserWithRoles = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    roles: v.optional(v.array(v.string())),
    ensureCustomerRole: v.optional(v.boolean()), // Default true
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Check if user already exists (unique by email)
    const existing = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();

    let userId: Id<'users'>;
    let userRoles: string[] = args.roles || [];

    if (existing) {
      userId = existing._id;
      // Merge with existing roles
      const existingRoles = existing.roles || [];
      userRoles = [...new Set([...existingRoles, ...userRoles])];
    } else {
      // Create new user
      userId = await ctx.db.insert('users', {
        name: args.name,
        email: args.email,
        password: '',
        status: 'active',
        roles: userRoles,
        lastModified: Date.now(),
      });
    }

    // Ensure customer role if requested (default true)
    const ensureCustomer = args.ensureCustomerRole !== false;
    if (ensureCustomer && !userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
    }

    // Update roles if needed
    if (existing) {
      await ctx.db.patch(userId, {
        roles: userRoles,
        lastModified: Date.now(),
      });
    }

    // Return the full user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('Failed to retrieve user after creation/update');
    }

    return user;
  },
});

/**
 * Convert bytes to base64url encoding (URL-safe base64 without padding)
 * This is more performant and secure than hex encoding:
 * - Shorter tokens (43 chars vs 64 chars for 32 bytes) = 33% reduction in size
 * - URL-safe (can be used in URLs without encoding)
 * - Better entropy per character (6 bits vs 4 bits for hex)
 * - Industry standard (used in JWT, OAuth tokens, etc.)
 */
function toBase64Url(bytes: Uint8Array): string {
  // Convert bytes to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Convert to base64, then to base64url: replace + with -, / with _, and remove padding
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a secure session token using crypto.getRandomValues (available in V8 runtime)
 * Uses base64url encoding for better performance and URL safety
 * This is more performant than Node.js crypto.randomBytes and works natively in Convex
 */
function generateSecureSessionToken(): string {
  // Generate 32 bytes of cryptographically secure random data
  // This provides 256 bits of entropy, which is more than sufficient for session tokens
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Use base64url encoding for better performance and URL safety
  return toBase64Url(array);
}

/**
 * Create and set a session token atomically
 * This is more performant than generating tokens externally and setting them separately
 */
export const createAndSetSessionToken = mutation({
  args: {
    userId: v.id("users"),
    expiresInDays: v.optional(v.number()), // Default to 30 days if not provided
    userAgent: v.optional(v.string()), // User agent for session tracking
    ipAddress: v.optional(v.string()), // IP address for session tracking
    deviceId: v.optional(v.string()), // Unique device identifier for tracking specific devices
    deviceName: v.optional(v.string()), // Human-readable device name (e.g., "John's iPhone", "Chrome on Mac")
  },
  returns: v.object({
    sessionToken: v.string(),
    sessionExpiry: v.number(),
  }),
  handler: async (ctx: MutationCtx, args) => {
    const { userId, expiresInDays = 30, userAgent, ipAddress, deviceId, deviceName } = args;

    // Generate secure session token using Convex-native crypto
    const sessionToken = generateSecureSessionToken();

    // Calculate expiry (default 30 days)
    const expiresInMs = expiresInDays * 24 * 60 * 60 * 1000;
    const sessionExpiry = Date.now() + expiresInMs;
    const now = Date.now();

    // Create an entry in the sessions table for session management (primary storage)
    // This supports multiple devices - each device gets its own session entry
    await ctx.db.insert("sessions", {
      userId,
      sessionToken,
      expiresAt: sessionExpiry,
      createdAt: now,
      userAgent: userAgent || undefined,
      ipAddress: ipAddress || undefined,
      deviceId: deviceId || undefined,
      deviceName: deviceName || undefined,
    });

    // Also update user document for backward compatibility
    // Note: This will overwrite any existing sessionToken on the user document,
    // but validation now primarily uses the sessions table, so this is okay
    await ctx.db.patch(userId, {
      sessionToken,
      sessionExpiry,
      lastModified: now,
    });

    return {
      sessionToken,
      sessionExpiry,
    };
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

/**
 * Clear expired session token from user document
 * This helps fix infinite loading issues when users have expired session tokens
 * that don't match any session in the sessions table
 */
export const clearExpiredSessionToken = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx: MutationCtx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check if session token is expired
    const isExpired = user.sessionExpiry && user.sessionExpiry < Date.now();

    if (isExpired || !user.sessionToken) {
      // Clear the expired session token
      await ctx.db.patch(args.userId, {
        sessionToken: undefined,
        sessionExpiry: undefined,
        lastModified: Date.now(),
      });

      return {
        success: true,
        message: isExpired ? 'Expired session token cleared' : 'Session token cleared'
      };
    }

    return { success: false, message: 'Session token is still valid' };
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
    console.log('[createOrUpdateOAuthUser] Mutation called with args:', {
      provider: args.provider,
      providerId: args.providerId,
      email: args.email,
      name: args.name,
      hasPicture: !!args.picture,
      verified: args.verified,
    });

    try {
      const now = Date.now();

      // Validate required fields
      if (!args.provider || !args.providerId || !args.email || !args.name) {
        const errorMsg = `Missing required fields: provider=${args.provider}, providerId=${args.providerId}, email=${args.email}, name=${args.name}`;
        console.error('[createOrUpdateOAuthUser] Validation error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Check if user already exists by OAuth provider ID
      let existingUser;
      try {
        console.log('[createOrUpdateOAuthUser] Querying users by OAuth provider...');
        const allUsers = await ctx.db.query('users').collect();
        console.log(`[createOrUpdateOAuthUser] Found ${allUsers.length} total users`);
        existingUser = allUsers.find(user =>
          user.oauthProviders?.some(oauth =>
            oauth.provider === args.provider &&
            oauth.providerId === args.providerId
          )
        );
        if (existingUser) {
          console.log('[createOrUpdateOAuthUser] Found existing user by OAuth provider:', existingUser._id);
        } else {
          console.log('[createOrUpdateOAuthUser] No existing user found by OAuth provider');
        }
      } catch (queryError) {
        console.error('[createOrUpdateOAuthUser] Error querying users by OAuth provider:', queryError);
        throw new Error(`Failed to query users: ${queryError instanceof Error ? queryError.message : String(queryError)}`);
      }

      if (existingUser) {
        // Update existing user's OAuth info
        try {
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
        } catch (patchError) {
          console.error('Error updating existing OAuth user:', patchError);
          throw new Error(`Failed to update OAuth user: ${patchError instanceof Error ? patchError.message : String(patchError)}`);
        }
      }

      // Check if user exists by email
      let userByEmail;
      try {
        console.log('[createOrUpdateOAuthUser] Querying user by email:', args.email);
        userByEmail = await ctx.db
          .query('users')
          .filter(q => q.eq(q.field('email'), args.email))
          .first();
        if (userByEmail) {
          console.log('[createOrUpdateOAuthUser] Found existing user by email:', userByEmail._id);
        } else {
          console.log('[createOrUpdateOAuthUser] No existing user found by email');
        }
      } catch (emailQueryError) {
        console.error('[createOrUpdateOAuthUser] Error querying user by email:', emailQueryError);
        throw new Error(`Failed to query user by email: ${emailQueryError instanceof Error ? emailQueryError.message : String(emailQueryError)}`);
      }

      if (userByEmail) {
        // Link OAuth to existing account
        try {
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
        } catch (patchError) {
          console.error('Error linking OAuth to existing user:', patchError);
          throw new Error(`Failed to link OAuth provider: ${patchError instanceof Error ? patchError.message : String(patchError)}`);
        }
      }

      // Create new user
      let userId: Id<'users'>;
      try {
        const userData = {
          name: args.name,
          email: args.email,
          password: '', // No password for OAuth users
          roles: ['customer'],
          status: 'active' as const,
          oauthProviders: [{ ...args, verified: args.verified ?? true }],
          primaryOAuthProvider: args.provider,
          lastModified: now,
          lastLogin: now,
        };

        console.log('[createOrUpdateOAuthUser] Creating new OAuth user with data:', {
          name: userData.name,
          email: userData.email,
          provider: userData.primaryOAuthProvider,
          hasOAuthProviders: !!userData.oauthProviders?.length,
        });

        userId = await ctx.db.insert('users', userData);
        console.log('[createOrUpdateOAuthUser] Successfully created user:', userId);
      } catch (insertError) {
        console.error('Failed to insert user:', insertError);
        const errorMessage = insertError instanceof Error ? insertError.message : String(insertError);
        const errorStack = insertError instanceof Error ? insertError.stack : undefined;
        console.error('Insert error details:', { errorMessage, errorStack, args });
        throw new Error(`Failed to create user: ${errorMessage}`);
      }

      // Initialize profile tracking records for new user
      // This is non-blocking - errors are caught and logged but don't fail user creation
      try {
        await initializeUserProfile(ctx, userId);
      } catch (initError) {
        console.error('Failed to initialize user profile (non-fatal):', initError);
        // Continue - user creation succeeded, profile initialization can be retried later
      }

      return { userId, isNewUser: true };
    } catch (error) {
      // Ensure all errors are properly formatted with messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('[createOrUpdateOAuthUser] ERROR:', {
        message: errorMessage,
        stack: errorStack,
        errorType: error?.constructor?.name,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
        args: {
          provider: args.provider,
          providerId: args.providerId,
          email: args.email,
          name: args.name,
        },
      });

      // Re-throw with a descriptive message
      const finalError = new Error(`OAuth user creation/update failed: ${errorMessage}`);
      console.error('[createOrUpdateOAuthUser] Throwing error:', finalError.message);
      throw finalError;
    }
  },
});
