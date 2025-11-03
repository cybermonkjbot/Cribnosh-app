import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

// Get current active session for a staff member
export const getActiveSession = query({
  args: {
    staffId: v.id('users'),
  },
  returns: v.union(v.object({
    _id: v.id('workSessions'),
    _creationTime: v.number(),
    staffId: v.id('users'),
    clockInTime: v.number(),
    clockOutTime: v.optional(v.number()),
    status: v.string(),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id('users')),
  }), v.null()),
  handler: async (ctx, args) => {
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
export const getWorkSessions = query({
  args: {
    staffId: v.id('users'),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id('workSessions'),
    _creationTime: v.number(),
    staffId: v.id('users'),
    clockInTime: v.number(),
    clockOutTime: v.optional(v.number()),
    status: v.string(),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id('users')),
  })),
  handler: async (ctx, args) => {
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
export const getWeeklyHours = query({
  args: {
    staffId: v.id('users'),
    weekStart: v.number(), // Start of week timestamp
    weekEnd: v.number(),   // End of week timestamp
  },
  returns: v.object({
    totalHours: v.number(),
    totalMinutes: v.number(),
    sessions: v.number(),
    sessionsList: v.array(v.object({
      _id: v.id('workSessions'),
      _creationTime: v.number(),
      staffId: v.id('users'),
      clockInTime: v.number(),
      clockOutTime: v.optional(v.number()),
      status: v.string(),
      duration: v.optional(v.number()),
      notes: v.optional(v.string()),
      location: v.optional(v.string()),
      createdBy: v.id('users'),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.id('users')),
    })),
  }),
  handler: async (ctx, args) => {
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

// Get today's sessions for a staff member
export const getTodaySessions = query({
  args: {
    staffId: v.id('users'),
  },
  returns: v.array(v.object({
    _id: v.id('workSessions'),
    _creationTime: v.number(),
    staffId: v.id('users'),
    clockInTime: v.number(),
    clockOutTime: v.optional(v.number()),
    status: v.string(),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id('users')),
  })),
  handler: async (ctx, args) => {
    const { staffId } = args;
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    
    const sessions = await ctx.db
      .query('workSessions')
      .filter(q => q.eq(q.field('staffId'), staffId))
      .filter(q => q.gte(q.field('clockInTime'), startOfDay))
      .filter(q => q.lte(q.field('clockInTime'), endOfDay))
      .collect();

    // Sort by clock in time (newest first)
    sessions.sort((a, b) => b.clockInTime - a.clockInTime);
    
    return sessions;
  },
});

// Get this week's sessions for a staff member
export const getThisWeekSessions = query({
  args: {
    staffId: v.id('users'),
  },
  returns: v.array(v.object({
    _id: v.id('workSessions'),
    _creationTime: v.number(),
    staffId: v.id('users'),
    clockInTime: v.number(),
    clockOutTime: v.optional(v.number()),
    status: v.string(),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id('users')),
  })),
  handler: async (ctx, args) => {
    const { staffId } = args;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    const sessions = await ctx.db
      .query('workSessions')
      .filter(q => q.eq(q.field('staffId'), staffId))
      .filter(q => q.gte(q.field('clockInTime'), startOfWeek.getTime()))
      .filter(q => q.lte(q.field('clockInTime'), endOfWeek.getTime()))
      .collect();

    // Sort by clock in time (newest first)
    sessions.sort((a, b) => b.clockInTime - a.clockInTime);
    
    return sessions;
  },
});

// Get a single work session by ID
export const getWorkSessionById = query({
  args: {
    sessionId: v.string(),
  },
  returns: v.union(v.object({
    _id: v.id('workSessions'),
    _creationTime: v.number(),
    staffId: v.id('users'),
    clockInTime: v.number(),
    clockOutTime: v.optional(v.number()),
    status: v.string(),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id('users')),
  }), v.null()),
  handler: async (ctx, args) => {
    const { sessionId } = args;
    
    // Get the session by ID
    const session = await ctx.db.get(sessionId as Id<'workSessions'>);
    
    if (!session) {
      return null;
    }
    
    // Since auth is handled by middleware, we assume the user is already authenticated
    // and authorized to access this session
    return session;
  },
});

// Admin: List work sessions across staff with filters and pagination
export const listSessionsAdmin = query({
  args: {
    staffId: v.optional(v.id('users')),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('paused'),
      v.literal('adjusted')
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    skip: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    results: v.array(v.object({
      _id: v.id('workSessions'),
      _creationTime: v.number(),
      staffId: v.id('users'),
      clockInTime: v.number(),
      clockOutTime: v.optional(v.number()),
      status: v.string(),
      duration: v.optional(v.number()),
      notes: v.optional(v.string()),
      location: v.optional(v.string()),
      createdBy: v.id('users'),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.id('users')),
    })),
  }),
  handler: async (ctx, args) => {
    const { staffId, status, startDate, endDate, skip = 0, limit = 50 } = args;

    let q: any = ctx.db.query('workSessions');
    let hasIndexedQuery = false;

    // Prefer indexed queries when possible
    if (staffId && startDate !== undefined) {
      q = ctx.db
        .query('workSessions')
        .withIndex('by_staff_date', (idx) => 
          idx.eq('staffId', staffId).gte('clockInTime', startDate!)
        );
      hasIndexedQuery = true;
      if (endDate !== undefined) {
        q = q.filter((f: any) => f.lte(f.field('clockInTime'), endDate!));
      }
    } else if (status) {
      q = ctx.db
        .query('workSessions')
        .withIndex('by_status', (idx) => idx.eq('status', status));
      hasIndexedQuery = true;
    } else if (startDate !== undefined) {
      q = ctx.db
        .query('workSessions')
        .withIndex('by_date', (idx) => idx.gte('clockInTime', startDate!));
      hasIndexedQuery = true;
      if (endDate !== undefined) {
        q = q.filter((f: any) => f.lte(f.field('clockInTime'), endDate!));
      }
    }

    // Apply filters only if we don't have an indexed query
    if (!hasIndexedQuery) {
      if (staffId) {
        q = q.filter((f: any) => f.eq(f.field('staffId'), staffId));
      }
      if (status) {
        q = q.filter((f: any) => f.eq(f.field('status'), status));
      }
      if (startDate !== undefined) {
        q = q.filter((f: any) => f.gte(f.field('clockInTime'), startDate));
      }
      if (endDate !== undefined) {
        q = q.filter((f: any) => f.lte(f.field('clockInTime'), endDate));
      }
    }

    let results = await q.collect();
    results.sort((a: any, b: any) => b.clockInTime - a.clockInTime);
    const total = results.length;
    if (skip) results = results.slice(skip);
    if (limit) results = results.slice(0, limit);
    return { total, results };
  },
});

// Get year-to-date total hours for a staff member
export const getYearToDateHours = query({
  args: {
    staffId: v.id('users'),
    year: v.optional(v.number()),
  },
  returns: v.object({
    totalHours: v.number(),
    totalMinutes: v.number(),
    sessions: v.number(),
    year: v.number(),
  }),
  handler: async (ctx, args) => {
    const { staffId, year } = args;
    
    const currentYear = new Date().getFullYear();
    const targetYear = year || currentYear;
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear + 1, 0, 1).getTime();
    
    const sessions = await ctx.db
      .query('workSessions')
      .withIndex('by_staff_date', (q) => 
        q.eq('staffId', staffId).gte('clockInTime', startOfYear)
      )
      .filter(q => q.lt(q.field('clockInTime'), endOfYear))
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
      year: targetYear,
    };
  },
});

// Admin: Get year-to-date hours summary for all staff
export const getAdminYearToDateHoursSummary = query({
  args: {
    year: v.optional(v.number()),
  },
  returns: v.object({
    year: v.number(),
    overallTotalHours: v.number(),
    staffBreakdown: v.record(v.string(), v.object({
      totalHours: v.number(),
      totalMinutes: v.number(),
      sessions: v.number(),
    })),
    totalSessions: v.number(),
  }),
  handler: async (ctx, args) => {
    const currentYear = new Date().getFullYear();
    const targetYear = args.year || currentYear;
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear + 1, 0, 1).getTime();
    
    // Get all completed work sessions for the year
    const sessions = await ctx.db
      .query('workSessions')
      .withIndex('by_date', (q) => q.gte('clockInTime', startOfYear))
      .filter(q => q.lt(q.field('clockInTime'), endOfYear))
      .filter(q => q.eq(q.field('status'), 'completed'))
      .collect();

    // Group by staff and calculate totals
    const staffHours: Record<string, { totalHours: number; totalMinutes: number; sessions: number }> = {};
    
    for (const session of sessions) {
      const staffId = session.staffId;
      if (!staffHours[staffId]) {
        staffHours[staffId] = { totalHours: 0, totalMinutes: 0, sessions: 0 };
      }
      
      const duration = session.duration || 0;
      staffHours[staffId].totalHours += duration / (1000 * 60 * 60); // Convert ms to hours
      staffHours[staffId].totalMinutes += duration / (1000 * 60); // Convert ms to minutes
      staffHours[staffId].sessions += 1;
    }

    // Calculate overall totals
    const overallTotal = Object.values(staffHours).reduce((total, staff) => {
      return total + staff.totalHours;
    }, 0);

    return {
      year: targetYear,
      overallTotalHours: overallTotal,
      staffBreakdown: staffHours,
      totalSessions: sessions.length,
    };
  },
});