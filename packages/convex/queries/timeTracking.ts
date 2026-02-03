// @ts-nocheck
import { requireStaff } from "../utils/auth";
import { query } from "../_generated/server";
import type { QueryCtx } from "../../../apps/web/types/convex-contexts";
import { v } from "convex/values";

export const getTimeTrackingReports = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const limit = 50;
    
    // Get real time tracking reports from database
    const reports = await ctx.db
      .query("reports")
      .filter((q) => 
        q.or(
          q.eq(q.field("type"), "timeTracking_daily"),
          q.eq(q.field("type"), "timeTracking_weekly"),
          q.eq(q.field("type"), "timeTracking_monthly"),
          q.eq(q.field("type"), "timeTracking_custom")
        )
      )
      .order("desc")
      .collect();
    
    // Filtering by userId and date range can be added back when needed
    // Currently returns all reports within limit
    
    return reports.slice(0, limit);
  },
});

export const getTimeTrackingStats = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args) => {
    await requireStaff(ctx, args.sessionToken);
    // Get all users for stats
    const allUsers = await ctx.db.query("users").collect();
    const activeUsers = allUsers.filter((user) => {
      const userDoc = user as { isActive?: boolean };
      return userDoc.isActive !== false;
    }).length;
    
    // Get all work sessions to calculate real stats
    const allWorkSessions = await ctx.db.query("workSessions").collect();
    
    // Calculate total hours from completed sessions
    const completedSessions = allWorkSessions.filter(session => 
      session.status === 'completed' && session.duration
    );
    const totalHoursInMinutes = completedSessions.reduce((sum, session) => {
      return sum + (session.duration || 0) / (1000 * 60); // Convert milliseconds to minutes
    }, 0);
    
    // Convert to hours for display (frontend expects minutes for formatDuration)
    const totalHours = totalHoursInMinutes / 60;
    
    // Calculate average hours per user
    const averageHoursPerUser = activeUsers > 0 ? totalHours / activeUsers : 0;
    
    // Calculate productivity score (based on average hours vs expected 8 hours per day)
    // This is a simplified calculation - adjust as needed
    const expectedHoursPerUser = 8 * 5; // 8 hours per day, 5 days per week
    const productivityScore = activeUsers > 0 
      ? Math.min(100, Math.round((averageHoursPerUser / expectedHoursPerUser) * 100 * 10) / 10)
      : 0;
    
    // Calculate top performers based on total hours
    const userHoursMap = new Map<string, { hours: number; sessions: number }>();
    
    completedSessions.forEach(session => {
      const userId = session.staffId;
      const minutes = (session.duration || 0) / (1000 * 60); // Convert to minutes
      const current = userHoursMap.get(userId) || { hours: 0, sessions: 0 };
      userHoursMap.set(userId, {
        hours: current.hours + (minutes / 60), // Store in hours for calculations
        sessions: current.sessions + 1
      });
    });
    
    // Get top performers with user names
    const topPerformers = Array.from(userHoursMap.entries())
      .map(([userId, data]) => {
        const user = allUsers.find(u => u._id === userId);
        const userName = (user as { name?: string; email?: string })?.name || 
                        (user as { email?: string })?.email || 
                        'Unknown User';
        // Calculate productivity based on hours worked
        const productivity = data.hours > 0 
          ? Math.min(100, Math.round((data.hours / expectedHoursPerUser) * 100 * 10) / 10)
          : 0;
        
        return {
          userId,
          userName,
          totalHours: Math.round(data.hours * 60), // Return in minutes for formatDuration function
          productivity
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);
    
    // Get recent activity from work sessions (last 5 clock-ins)
    const recentSessions = allWorkSessions
      .filter(session => session.clockInTime)
      .sort((a, b) => b.clockInTime - a.clockInTime)
      .slice(0, 5);
    
    const recentActivity = recentSessions.map(session => {
      const user = allUsers.find(u => u._id === session.staffId);
      const userName = (user as { name?: string; email?: string })?.name || 
                      (user as { email?: string })?.email || 
                      'Unknown User';
      
      let action = 'Started time tracking';
      if (session.status === 'completed') {
        action = 'Completed time tracking';
      } else if (session.status === 'paused') {
        action = 'Paused time tracking';
      }
      
      return {
        userId: session.staffId,
        userName,
        action,
        timestamp: session.clockInTime
      };
    });
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers,
      totalHours: Math.round(totalHoursInMinutes), // Return in minutes for formatDuration function
      averageHoursPerUser: Math.round(averageHoursPerUser * 10) / 10,
      productivityScore: Math.round(productivityScore * 10) / 10,
      topPerformers,
      recentActivity,
    };
  },
});

export const getDepartments = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args) => {
    await requireStaff(ctx, args.sessionToken);
    // Extract unique departments from users table
    // Optimize: Only fetch users with departments, not all users
    const allUsers = await ctx.db.query("users").collect();
    
    // Get unique department names and group users by department
    const departmentMap = new Map<string, Id<'users'>[]>();
    allUsers.forEach((user) => {
      const userDoc = user as { department?: string };
      if (userDoc.department) {
        if (!departmentMap.has(userDoc.department)) {
          departmentMap.set(userDoc.department, []);
        }
        departmentMap.get(userDoc.department)!.push(user._id);
      }
    });
    
    // Return empty array if no departments exist
    if (departmentMap.size === 0) {
      return [];
    }
    
    // Get all work sessions once (optimized: fetch once instead of per department)
    const allWorkSessions = await ctx.db.query("workSessions").collect();
    
    // Create a map of work sessions by staffId for efficient lookup
    const sessionsByStaffId = new Map<Id<'users'>, typeof allWorkSessions>();
    allWorkSessions.forEach(session => {
      if (!sessionsByStaffId.has(session.staffId)) {
        sessionsByStaffId.set(session.staffId, []);
      }
      sessionsByStaffId.get(session.staffId)!.push(session);
    });
    
    // Calculate stats for each department using the pre-fetched data
    const departmentsWithStats = Array.from(departmentMap.entries()).map(([deptName, userIds]) => {
      // Calculate total hours for this department
      const workSessions = userIds.flatMap(userId => 
        sessionsByStaffId.get(userId) || []
      );
      
      const totalHours = workSessions.reduce((sum, session) => {
        return sum + (session.duration || 0) / (1000 * 60 * 60); // Convert milliseconds to hours
      }, 0);
      
      return {
        id: deptName.toLowerCase().replace(/\s+/g, "-"),
        name: deptName,
        userCount: userIds.length,
        totalHours: Math.round(totalHours * 10) / 10
      };
    });
    
    return departmentsWithStats;
  },
});

