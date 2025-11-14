import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { query, QueryCtx, internalQuery } from '../_generated/server';
import { isAdmin, isStaff, requireAdmin, requireAuth, requireAuthBySessionToken, requireStaff } from '../utils/auth';

export const getById = query({
  args: { 
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication - use session token if provided, otherwise fall back to requireAuth
    let user;
    if (args.sessionToken) {
      user = await requireAuthBySessionToken(ctx, args.sessionToken);
    } else {
      // Fallback for backward compatibility (won't work without setAuth, but keeping for now)
      user = await requireAuth(ctx);
    }
    
    // Users can access their own data, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db.get(args.userId);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: QueryCtx, args: { email: string }) => {
    return await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();
  },
});

export const getUserByPhone = query({
  args: { 
    phone: v.string(),
  },
  handler: async (ctx: QueryCtx, args: { phone: string }) => {
    // Public query - used during phone sign-in to check if user exists
    // Similar to getUserByEmail, this is safe as it only returns basic user lookup
    return await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phone_number', args.phone))
      .first();
  },
});

export const getUserByOAuthProvider = query({
  args: { 
    provider: v.union(v.literal('google'), v.literal('apple')),
    providerId: v.string(),
  },
  handler: async (ctx: QueryCtx, args: { provider: 'google' | 'apple', providerId: string }) => {
    // Public query - used during OAuth sign-in (Google/Apple) to find existing users
    // Similar to getUserByEmail, this is safe as it only returns basic user lookup
    const users = await ctx.db.query('users').collect();
    
    // Find user by OAuth provider ID
    const foundUser = users.find(user => 
      user.oauthProviders?.some(oauth => 
        oauth.provider === args.provider && 
        oauth.providerId === args.providerId
      )
    );
    
    return foundUser;
  },
});

/**
 * Internal query to get user by ID without authentication
 * Used by actions during login/signup flows before session tokens exist
 */
export const _getUserByIdInternal = internalQuery({
  args: { 
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getAllUsers = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db.query('users').collect();
  },
});

export const getUsersByRole = query({
  args: { 
    roles: v.array(v.string()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { roles: string[]; sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    const users = await ctx.db.query('users').collect();
    return users.filter(u => {
      const userRoles = (u as any).roles as string[] | undefined;
      return userRoles && 
             Array.isArray(userRoles) && 
             args.roles.some(role => userRoles.includes(role));
    });
  },
});

export const getUsersByStatus = query({
  args: { 
    status: v.string(),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { status: string; sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('status'), args.status))
      .collect();
  },
});

export const getRecentUsers = query({
  args: { 
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { limit?: number; sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    const users = await ctx.db.query('users').collect();
    const sorted = users.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    return sorted.slice(0, args.limit || 10);
  },
});

export const getAllStaff = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    const users = await ctx.db.query('users').collect();
    return users.filter(u => Array.isArray(u.roles) && u.roles.includes('staff')).map(u => ({ 
      _id: u._id, 
      name: u.name, 
      email: u.email,
      role: u.roles?.find((r: string) => ['staff', 'admin', 'moderator'].includes(r)) || u.roles?.[0] || 'staff',
      status: u.status || 'active'
    }));
  },
});

export const getUserDocuments = query({
  args: { 
    email: v.string(),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { email: string; sessionToken?: string }) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get user by email to check ownership
    const targetUser = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();
    
    // Users can access their own documents, staff/admin can access any
    if (targetUser && !isAdmin(user) && !isStaff(user) && targetUser._id !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db
      .query('documents')
      .filter(q => q.eq(q.field('userEmail'), args.email))
      .collect();
  },
});

export const getAllDocuments = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db.query('documents').collect();
  },
});

export const getUserNotifications = query({
  args: { 
    userId: v.id("users"), 
    roles: v.optional(v.array(v.string())),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication - use session token if provided, otherwise fall back to requireAuth
    let user;
    if (args.sessionToken) {
      user = await requireAuthBySessionToken(ctx, args.sessionToken);
    } else {
      // Fallback for backward compatibility (won't work without setAuth, but keeping for now)
      user = await requireAuth(ctx);
    }
    
    // Users can access their own notifications, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    // User-specific notifications
    const userNotifs = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
    // Global notifications for any of the user's roles
    let globalNotifs: any[] = [];
    if (args.roles && args.roles.length > 0) {
      const allGlobalNotifs = await ctx.db
        .query("notifications")
        .filter(q => q.eq(q.field("global"), true))
        .order("desc")
        .collect();
      
      // Filter notifications where any of the user's roles match the notification's roles
      globalNotifs = allGlobalNotifs.filter(notif => 
        notif.roles && notif.roles.some(role => args.roles?.includes(role))
      ).slice(0, 20);
    }
    // Merge and sort by createdAt
    const all = [...userNotifs, ...globalNotifs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
    return all;
  },
});

export const countUnreadNotifications = query({
  args: { 
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own notifications, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const notifs = await ctx.db.query('notifications')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .collect();
    return notifs.filter(n => !n.read).length;
  }
});

export const getUserReferralStats = query({
  args: { 
    userId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  returns: v.object({
    referralCount: v.number(),
    rewards: v.any(),
    affiliateStatus: v.string(),
    referralLink: v.union(v.string(), v.null()),
    referralHistory: v.array(v.any())
  }),
  handler: async (ctx, args) => {
    // Require authentication
    const authUser = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own stats, staff/admin can access any
    if (!isAdmin(authUser) && !isStaff(authUser) && args.userId !== authUser._id) {
      throw new Error('Access denied');
    }
    try {
      const targetUser = await ctx.db.get(args.userId);
      if (!targetUser) throw new Error("User not found");
      const userData = targetUser as { referralCount?: number; rewards?: unknown; affiliateStatus?: string; referralLink?: string | null; referralHistory?: unknown[] };
      return {
        referralCount: userData.referralCount || 0,
        rewards: userData.rewards || {},
        affiliateStatus: userData.affiliateStatus || "none",
        referralLink: userData.referralLink || null,
        referralHistory: userData.referralHistory || [],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  },
});

export const getReferralLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    forkprint: v.number(),
    userId: v.id("users")
  })),
  handler: async (ctx, args) => {
    try {
      const users = await ctx.db.query("users").collect();
      const usersWithReferrals = users.map(u => u as { referralCount?: number; name?: string; avatar?: string; _id: Id<"users"> });
      const sorted = usersWithReferrals
        .filter(u => u.referralCount && u.referralCount > 0)
        .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
      const top = sorted.slice(0, args.limit || 10).map(u => ({
        name: u.name,
        avatar: u.avatar,
        forkprint: u.referralCount || 0,
        userId: u._id,
      }));
      return top;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  },
});

export const getUserReferralHistory = query({
  args: { 
    userId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(v.object({
    _id: v.id("referrals"),
    referredUserId: v.optional(v.id("users")),
    referralCode: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    rewardTier: v.optional(v.string()),
    status: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own history, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    try {
      // Fetch referrals using index for performance
      const referrals = await ctx.db
        .query("referrals")
        .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
        .order("desc")
        .collect();
      const referralData = referrals.map((r) => {
        const ref = r as { 
          _id: Id<"referrals">; 
          referredUserId?: Id<"users">; 
          referralCode?: string; 
          createdAt?: number; 
          completedAt?: number; 
          rewardTier?: string; 
          status?: string;
        };
        return {
          _id: ref._id,
          referredUserId: ref.referredUserId,
          referralCode: ref.referralCode,
          createdAt: ref.createdAt,
          completedAt: ref.completedAt,
          rewardTier: ref.rewardTier,
          status: ref.status,
        };
      });
      return referralData;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  },
});

export const getUserReferralHistoryPaginated = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
    sessionToken: v.optional(v.string())
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own history, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    try {
      const q = ctx.db
        .query("referrals")
        .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
        .order("desc");
      return await q.paginate(args.paginationOpts);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  },
});

export const getUserByNameOrEmail = query({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query('users').collect();
    return users.find(
      (u) => u.name === args.identifier || u.email === args.identifier
    ) || null;
  },
});

export const getUserBySessionToken = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('sessionToken'), args.sessionToken))
      .first();
    if (!user || !user.sessionExpiry || user.sessionExpiry < Date.now()) {
      return null;
    }
    return user;
  },
});

export const getStripeCustomerId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.stripeCustomerId;
  },
});

export const getUserProfile = query({
  args: { 
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own profile, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db.get(args.userId);
  },
});

export const getDietaryPreferences = query({
  args: { 
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own preferences, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const targetUser = await ctx.db.get(args.userId);
    return {
      tags: targetUser?.preferences?.dietary || [],
      allergies: [] // allergies field doesn't exist in schema, using empty array
    };
  },
});

export const getFavoriteCuisines = query({
  args: { 
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own preferences, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const targetUser = await ctx.db.get(args.userId);
    return targetUser?.preferences?.cuisine || [];
  },
});

// Get user by ID (alias for getById for consistency)
export const getUserById = query({
  args: { 
    userId: v.id('users'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own data, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db.get(args.userId);
  },
});

// Get current user from session (for client-side use)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // For now, return null since we need to get the user from the session token
    // This will be handled by the AdminUserProvider using the session token from cookies
    return null;
  },
});

// Get user by token (for admin middleware)
export const getUserByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('sessionToken'), args.token))
      .first();
    
    if (!user || !user.sessionExpiry || user.sessionExpiry < Date.now()) {
      return null;
    }
    return user;
  },
});

// Get all users (alias for getAllUsers for consistency)
export const getAll = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db.query('users').collect();
  },
});

// Get total user count for admin sidebar
export const getTotalUserCount = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    const users = await ctx.db.query('users').collect();
    return users.length;
  },
});

export const getUsersForAdmin = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    
    const users = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    return users.map(user => ({
      _id: user._id,
      email: user.email,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      name: user.name || user.email,
      status: user.status,
      roles: user.roles || [],
      createdAt: user._creationTime,
      lastLogin: user.lastLogin,
      isActive: user.status === 'active'
    }));
  },
});
