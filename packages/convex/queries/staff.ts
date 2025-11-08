import { v } from 'convex/values';
import { Doc } from '../_generated/dataModel';
import { query, QueryCtx } from '../_generated/server';
import { isAdmin, isStaff, requireAdmin, requireAuth, requireAuthBySessionToken, requireStaff } from '../utils/auth';

// Staff Email Campaign Queries
export const getStaffEmailCampaigns = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.array(v.object({
    _id: v.id("staffEmailCampaigns"),
    _creationTime: v.number(),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    recipientType: v.union(
      v.literal("all_waitlist"),
      v.literal("pending_waitlist"),
      v.literal("approved_waitlist"),
      v.literal("converted_users"),
      v.literal("all_users")
    ),
    recipientCount: v.number(),
    sentCount: v.number(),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  })),
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db
      .query("staffEmailCampaigns")
      .order("desc")
      .collect();
  },
});

export const getStaffStats = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.object({
    totalStaff: v.number(),
    activeStaff: v.number(),
    totalUsers: v.number(),
    activeUsers: v.number(),
    totalCampaigns: v.number(),
    monthlyCampaigns: v.number(),
    deliveryRate: v.number(),
  }),
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require staff/admin authentication
    await requireStaff(ctx, args.sessionToken);
    
    const allStaff = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("roles"), ["staff"]))
      .collect();
    
    const activeStaff = allStaff.filter(staff => staff.status === "active");
    
    // Get total users who can receive emails (waitlist + converted users)
    const [waitlistEntries, convertedUsers] = await Promise.all([
      ctx.db.query("waitlist").collect(),
      ctx.db.query("users")
        .filter((q) => q.eq(q.field("roles"), ["customer"]))
        .collect(),
    ]);
    
    const totalUsers = waitlistEntries.length + convertedUsers.length;
    const activeUsers = waitlistEntries.filter((entry: Doc<"waitlist">) => 
      entry.status === 'active' || entry.status === 'approved'
    ).length + convertedUsers.filter((user: Doc<"users">) => user.status === 'active').length;
    
    const campaigns = await ctx.db
      .query("staffEmailCampaigns")
      .collect();
    
    const totalCampaigns = campaigns.length;
    const monthlyCampaigns = campaigns.filter((campaign: Doc<"staffEmailCampaigns">) => {
      const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return campaign.createdAt > monthAgo;
    }).length;
    
    const sentCampaigns = campaigns.filter((campaign: Doc<"staffEmailCampaigns">) => campaign.status === "sent");
    const totalSent = sentCampaigns.reduce((sum: number, campaign: Doc<"staffEmailCampaigns">) => sum + campaign.sentCount, 0);
    const totalRecipients = sentCampaigns.reduce((sum: number, campaign: Doc<"staffEmailCampaigns">) => sum + campaign.recipientCount, 0);
    
    const deliveryRate = totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100) : 0;
    
    return {
      totalStaff: allStaff.length,
      activeStaff: activeStaff.length,
      totalUsers,
      activeUsers,
      totalCampaigns,
      monthlyCampaigns,
      deliveryRate,
    };
  },
});

// Work Email Request Queries
export const getWorkEmailRequestsByUser = query({
  args: { 
    userId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own requests, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db
      .query('workEmailRequests')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .collect();
  },
});

export const getAllWorkEmailRequests = query({
  args: { 
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    let query = ctx.db.query('workEmailRequests');
    if (args.status) {
      query = query.filter(q => q.eq(q.field('status'), args.status));
    }
    const requests = await query.order('desc').collect();
    // Join user info
    const withUser = await Promise.all(requests.map(async req => {
      const user = req.userId ? await ctx.db.get(req.userId) : null;
      return {
        ...req,
        name: user?.name || '',
        department: user?.department || '',
        position: user?.position || '',
      };
    }));
    return withUser;
  },
});

export const getWorkEmailRequestsByDepartment = query({
  args: { 
    department: v.string(),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db
      .query('workEmailRequests')
      .filter(q => q.eq(q.field('department'), args.department))
      .order('desc')
      .collect();
  },
});

export const getPendingWorkEmailRequests = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require HR/admin authentication
    await requireAdmin(ctx, args.sessionToken);
    return await ctx.db
      .query('workEmailRequests')
      .filter(q => q.eq(q.field('status'), 'pending'))
      .order('desc')
      .collect();
  },
});

// Leave Request Queries
export const getLeaveRequestsByUser = query({
  args: { 
    userId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own requests, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db
      .query('leaveRequests')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .collect();
  },
});

export const getAllLeaveRequests = query({
  args: { 
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    leaveType: v.optional(v.union(v.literal("annual"), v.literal("sick"), v.literal("personal"), v.literal("maternity"), v.literal("paternity"), v.literal("bereavement"), v.literal("other"))),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    let query = ctx.db.query('leaveRequests');
    if (args.status) {
      query = query.filter(q => q.eq(q.field('status'), args.status));
    }
    if (args.leaveType) {
      query = query.filter(q => q.eq(q.field('leaveType'), args.leaveType));
    }
    const requests = await query.order('desc').collect();
    // Join user info
    const withUser = await Promise.all(requests.map(async req => {
      const user = req.userId ? await ctx.db.get(req.userId) : null;
      return {
        ...req,
        name: user?.name || '',
        department: user?.department || '',
        position: user?.position || '',
      };
    }));
    return withUser;
  },
});

export const getPendingLeaveRequests = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require HR/admin authentication
    await requireAdmin(ctx, args.sessionToken);
    return await ctx.db
      .query('leaveRequests')
      .filter(q => q.eq(q.field('status'), 'pending'))
      .order('desc')
      .collect();
  },
});

export const getLeaveRequestsByDateRange = query({
  args: { 
    startDate: v.string(),
    endDate: v.string(),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db
      .query('leaveRequests')
      .filter(q => 
        q.and(
          q.gte(q.field('startDate'), args.startDate),
          q.lte(q.field('endDate'), args.endDate)
        )
      )
      .order('desc')
      .collect();
  },
});

// Work ID Queries
export const getWorkIdByUser = query({
  args: { 
    userId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own work ID, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db
      .query('workIds')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .first();
  },
});

export const getAllWorkIds = query({
  args: { 
    status: v.optional(v.union(v.literal("active"), v.literal("expired"), v.literal("revoked"))),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    let query = ctx.db.query('workIds');
    
    if (args.status) {
      query = query.filter(q => q.eq(q.field('status'), args.status));
    }
    
    return await query.order('desc').collect();
  },
});

export const getActiveWorkIds = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require HR/admin authentication
    await requireAdmin(ctx, args.sessionToken);
    return await ctx.db
      .query('workIds')
      .filter(q => q.eq(q.field('status'), 'active'))
      .order('desc')
      .collect();
  },
});

export const getExpiredWorkIds = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const now = Date.now();
    return await ctx.db
      .query('workIds')
      .filter(q => 
        q.and(
          q.eq(q.field('status'), 'active'),
          q.lt(q.field('expiresAt'), now)
        )
      )
      .order('desc')
      .collect();
  },
});

export const getWorkIdByNumber = query({
  args: { 
    workIdNumber: v.string(),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    
    return await ctx.db
      .query('workIds')
      .filter(q => q.eq(q.field('workIdNumber'), args.workIdNumber))
      .first();
  },
});

// Staff Overview Queries
export const getStaffOverviewStats = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    const [
      totalStaff,
      pendingWorkEmailRequests,
      pendingLeaveRequests,
      activeWorkIds,
      expiredWorkIds
    ] = await Promise.all([
      (await ctx.db.query('users').collect()).filter(u => Array.isArray(u.roles) && (u.roles.includes('staff') || u.roles.includes('admin'))),
      ctx.db.query('workEmailRequests').filter(q => q.eq(q.field('status'), 'pending')).collect(),
      ctx.db.query('leaveRequests').filter(q => q.eq(q.field('status'), 'pending')).collect(),
      ctx.db.query('workIds').filter(q => q.eq(q.field('status'), 'active')).collect(),
      ctx.db.query('workIds').filter(q => q.eq(q.field('status'), 'expired')).collect(),
    ]);

    return {
      totalStaff: totalStaff.length,
      pendingWorkEmailRequests: pendingWorkEmailRequests.length,
      pendingLeaveRequests: pendingLeaveRequests.length,
      activeWorkIds: activeWorkIds.length,
      expiredWorkIds: expiredWorkIds.length,
    };
  },
});

export const getStaffByDepartment = query({
  args: { 
    department: v.optional(v.string()),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    
    let users = await ctx.db.query('users').collect();
    users = users.filter(u => Array.isArray(u.roles) && (u.roles.includes('staff') || u.roles.includes('admin')));
    if (args.department) {
      users = users.filter(u => u.department === args.department);
    }
    return users;
  },
});

export const getStaffAssignmentByUser = query({
  args: { 
    userId: v.id("users"),
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
    
    // Users can access their own assignment, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    return await ctx.db.query("staffAssignments").filter(q => q.eq(q.field("userId"), args.userId)).first();
  },
});

// Request History Queries
export const getRequestHistory = query({
  args: { 
    userId: v.id("users"),
    type: v.optional(v.union(v.literal("workEmail"), v.literal("leave"), v.literal("workId"))),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own history, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }
    const results: any[] = [];
    
    if (!args.type || args.type === 'workEmail') {
      const workEmailRequests = await ctx.db
        .query('workEmailRequests')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .order('desc')
        .collect();
      
      results.push(...workEmailRequests.map(req => ({
        ...req,
        type: 'workEmail',
        title: `Work Email Request - ${req.requestedEmail}`,
      })));
    }
    
    if (!args.type || args.type === 'leave') {
      const leaveRequests = await ctx.db
        .query('leaveRequests')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .order('desc')
        .collect();
      
      results.push(...leaveRequests.map(req => ({
        ...req,
        type: 'leave',
        title: `${req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1)} Leave Request`,
      })));
    }
    
    if (!args.type || args.type === 'workId') {
      const workIds = await ctx.db
        .query('workIds')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .order('desc')
        .collect();
      
      results.push(...workIds.map(workId => ({
        ...workId,
        type: 'workId',
        title: `Work ID - ${workId.workIdNumber}`,
      })));
    }
    
    // Sort by timestamp (most recent first)
    return results.sort((a, b) => {
      const aTime = a.submittedAt || a.issuedAt || 0;
      const bTime = b.submittedAt || b.issuedAt || 0;
      return bTime - aTime;
    });
  },
});

// Admin Dashboard Queries
export const getAdminStaffDashboard = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const [
      pendingWorkEmailRequests,
      pendingLeaveRequests,
      recentWorkIds
    ] = await Promise.all([
      ctx.db.query('workEmailRequests')
        .filter(q => q.eq(q.field('status'), 'pending'))
        .order('desc')
        .take(10),
      ctx.db.query('leaveRequests')
        .filter(q => q.eq(q.field('status'), 'pending'))
        .order('desc')
        .take(10),
      ctx.db.query('workIds')
        .filter(q => q.eq(q.field('status'), 'active'))
        .order('desc')
        .take(10)
    ]);
    let staffStats = await ctx.db.query('users').collect();
    staffStats = staffStats.filter(u => Array.isArray(u.roles) && (u.roles.includes('staff') || u.roles.includes('admin')));

    // Join staffAssignments for each staff
    const staffWithAssignments = await Promise.all(staffStats.map(async (user) => {
      const assignment = await ctx.db.query('staffAssignments').filter(q => q.eq(q.field('userId'), user._id)).first();
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: assignment?.department || null,
        position: assignment?.position || null,
        roles: user.roles,
        status: user.status,
      };
    }));

    return {
      pendingWorkEmailRequests,
      pendingLeaveRequests,
      recentWorkIds,
      totalStaff: staffStats.length,
      activeStaff: staffStats.filter(s => s.status === 'active').length,
      staff: staffWithAssignments,
    };
  },
}); 

export const getActiveStaffNotices = query({
  args: {
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    let query = ctx.db.query('staffNotices').withIndex('by_isActive', q => q.eq('isActive', true));
    let notices = await query.order('desc').collect();
    // Filter: show global notices, or those matching department/position
    return notices.filter(n =>
      (!n.department && !n.position) ||
      (args.department && n.department === args.department) ||
      (args.position && n.position === args.position)
    );
  },
}); 