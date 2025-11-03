import { mutation, MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory,
  ErrorCode
} from '../../../apps/web/lib/errors/convex-exports';

function isAdminOrHR(user: any): boolean {
  return user && (user.role === 'admin' || user.role === 'hr' || user.role === 'human_resources');
}

// Clock in - start a new work session
export const clockIn = mutation({
  args: {
    staffId: v.id('users'),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { staffId, notes, location } = args;
    
    // Get the staff member
    const staff = await ctx.db.get(staffId);
    if (!staff) {
      return { status: 'error', error: 'Staff member not found' };
    }

    // Check if there's already an active session
    const activeSession = await ctx.db
      .query('workSessions')
      .filter(q => q.eq(q.field('staffId'), staffId))
      .filter(q => q.eq(q.field('status'), 'active'))
      .first();

    if (activeSession) {
      return { status: 'error', error: 'Already clocked in. Please clock out first.' };
    }

    // Create new work session
    const sessionId = await ctx.db.insert('workSessions', {
      staffId,
      clockInTime: Date.now(),
      status: 'active',
      notes: notes || '',
      location: location || '',
      createdBy: staffId, // Staff creates their own session
      createdAt: Date.now(),
    });

    return { 
      status: 'success', 
      sessionId,
      clockInTime: Date.now()
    };
  },
});

// Clock out - end the current work session
export const clockOut = mutation({
  args: {
    staffId: v.id('users'),
    notes: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { staffId, notes } = args;
    
    // Get the staff member
    const staff = await ctx.db.get(staffId);
    if (!staff) {
      return { status: 'error', error: 'Staff member not found' };
    }

    // Find the active session
    const activeSession = await ctx.db
      .query('workSessions')
      .filter(q => q.eq(q.field('staffId'), staffId))
      .filter(q => q.eq(q.field('status'), 'active'))
      .first();

    if (!activeSession) {
      return { status: 'error', error: 'No active session found. Please clock in first.' };
    }

    const clockOutTime = Date.now();
    const duration = clockOutTime - (activeSession as any)?.clockInTime;

    // Update the session
    await ctx.db.patch(activeSession._id, {
      clockOutTime,
      duration,
      status: 'completed',
      notes: notes || activeSession.notes,
      updatedBy: staffId,
      updatedAt: Date.now(),
    });

    return { 
      status: 'success', 
      sessionId: activeSession._id,
      clockOutTime,
      duration
    };
  },
});

// Get current active session for a staff member
export const getActiveSession = mutation({
  args: {
    staffId: v.id('users'),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { staffId } = args;
    
    const activeSession = await ctx.db
      .query('workSessions')
      .filter(q => q.eq(q.field('staffId'), staffId))
      .filter(q => q.eq(q.field('status'), 'active'))
      .first();

    return activeSession;
  },
});

// Get work sessions for a staff member within a date range
export const getWorkSessions = mutation({
  args: {
    staffId: v.id('users'),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { staffId, startDate, endDate, limit = 50 } = args;
    
    let query = ctx.db
      .query('workSessions')
      .filter(q => q.eq(q.field('staffId'), staffId));

    if (startDate) {
      query = query.filter(q => q.gte(q.field('clockInTime'), startDate));
    }
    
    if (endDate) {
      query = query.filter(q => q.lte(q.field('clockInTime'), endDate));
    }

    const sessions = await query.collect();
    
    // Sort by clock in time (newest first)
    sessions.sort((a, b) => b.clockInTime - a.clockInTime);
    
    return sessions.slice(0, limit);
  },
});

// Calculate weekly hours for a staff member
export const getWeeklyHours = mutation({
  args: {
    staffId: v.id('users'),
    weekStart: v.number(), // Start of week timestamp
    weekEnd: v.number(),   // End of week timestamp
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { staffId, weekStart, weekEnd } = args;
    
    const sessions = await ctx.db
      .query('workSessions')
      .filter(q => q.eq(q.field('staffId'), staffId))
      .filter(q => q.gte(q.field('clockInTime'), weekStart))
      .filter(q => q.lte(q.field('clockInTime'), weekEnd))
      .filter(q => q.eq(q.field('status'), 'completed'))
      .collect();

    const totalHours = sessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);

    const totalHoursInHours = totalHours / (1000 * 60 * 60); // Convert ms to hours

    return {
      totalHours: totalHoursInHours,
      totalMinutes: totalHours / (1000 * 60),
      sessions: sessions.length,
      sessionsList: sessions,
    };
  },
}); 

// Admin: Adjust a work session (change times, notes, status)
export const adjustSession = mutation({
  args: {
    sessionId: v.id('workSessions'),
    updates: v.object({
      clockInTime: v.optional(v.number()),
      clockOutTime: v.optional(v.number()),
      duration: v.optional(v.number()),
      status: v.optional(v.union(
        v.literal('active'),
        v.literal('completed'),
        v.literal('paused'),
        v.literal('adjusted')
      )),
      notes: v.optional(v.string()),
      isOvertime: v.optional(v.boolean()),
      payPeriodId: v.optional(v.id('payPeriods')),
    }),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: 'error', error: 'Not authenticated' };
    const adminUser = await ctx.runQuery(api.queries.users.getById, { userId: identity.subject as Id<"users"> });
    if (!isAdminOrHR(adminUser)) return { status: 'error', error: 'Not authorized' };

    const session = await ctx.db.get(args.sessionId);
    if (!session) return { status: 'error', error: 'Session not found' };

    const update: any = { ...args.updates, updatedBy: identity.subject as Id<"users">, updatedAt: Date.now() };
    // If only times provided, recompute duration
    const inTime = update.clockInTime ?? (session as any)?.clockInTime;
    const outTime = update.clockOutTime ?? (session as any)?.clockOutTime;
    if (inTime && outTime && update.duration === undefined) {
      update.duration = outTime - inTime;
      if (!update.status) update.status = 'completed';
    }

    await ctx.db.patch(args.sessionId, update);
    return { status: 'ok' };
  },
});

// Admin: Delete a work session
export const deleteSession = mutation({
  args: { sessionId: v.id('workSessions') },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: 'error', error: 'Not authenticated' };
    const adminUser = await ctx.runQuery(api.queries.users.getById, { userId: identity.subject as Id<"users"> });
    if (!isAdminOrHR(adminUser)) return { status: 'error', error: 'Not authorized' };
    const session = await ctx.db.get(args.sessionId);
    if (!session) return { status: 'error', error: 'Session not found' };
    await ctx.db.delete(args.sessionId);
    return { status: 'ok' };
  },
});