import { query } from "../_generated/server";
import type { QueryCtx } from "../../../apps/web/types/convex-contexts";

export const getTimeTrackingReports = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
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
  args: {},
  handler: async (ctx: QueryCtx) => {
    // Stats query - no filtering needed for now
    
    // Get all users for stats
    const allUsers = await ctx.db.query("users").collect();
    const activeUsers = allUsers.filter((user) => {
      const userDoc = user as { isActive?: boolean };
      return userDoc.isActive !== false;
    }).length;
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers,
      totalHours: 168.5,
      averageHoursPerUser: 8.4,
      productivityScore: 87.5,
      topPerformers: [
        { userId: "user1", userName: "John Doe", totalHours: 45.5, productivity: 92.3 },
        { userId: "user2", userName: "Jane Smith", totalHours: 42.0, productivity: 89.1 },
        { userId: "user3", userName: "Mike Johnson", totalHours: 38.5, productivity: 85.7 },
        { userId: "user4", userName: "Sarah Wilson", totalHours: 35.0, productivity: 82.4 },
        { userId: "user5", userName: "David Brown", totalHours: 32.5, productivity: 79.8 },
      ],
      recentActivity: [
        { userId: "user1", userName: "John Doe", action: "Started time tracking", timestamp: Date.now() - 3600000 },
        { userId: "user2", userName: "Jane Smith", action: "Completed project task", timestamp: Date.now() - 7200000 },
        { userId: "user3", userName: "Mike Johnson", action: "Paused time tracking", timestamp: Date.now() - 10800000 },
        { userId: "user4", userName: "Sarah Wilson", action: "Generated report", timestamp: Date.now() - 14400000 },
        { userId: "user5", userName: "David Brown", action: "Updated time entry", timestamp: Date.now() - 18000000 },
      ],
    };
  },
});

export const getDepartments = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    // Extract unique departments from users table
    const allUsers = await ctx.db.query("users").collect();
    
    // Get unique department names
    const departmentNames = new Set<string>();
    allUsers.forEach((user) => {
      const userDoc = user as { department?: string };
      if (userDoc.department) {
        departmentNames.add(userDoc.department);
      }
    });
    
    // Default departments if none exist
    const defaultDepartments = [
      "Engineering",
      "Design", 
      "Marketing",
      "Sales",
      "Support"
    ];
    
    // Use default departments if no users have departments set
    const departmentList = departmentNames.size > 0 
      ? Array.from(departmentNames)
      : defaultDepartments;
    
    // Calculate stats for each department
    const departmentsWithStats = await Promise.all(
      departmentList.map(async (deptName) => {
        const users = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("department"), deptName))
          .collect();
        
        // Calculate total hours for this department - timelogs don't have department field directly
        // This would need to be calculated from workSessions or user department assignments
        const totalHours = 0; // TODO: Calculate from actual time tracking data
        
        return {
          id: deptName.toLowerCase().replace(/\s+/g, "-"),
          name: deptName,
          userCount: users.length,
          totalHours: Math.round(totalHours * 10) / 10
        };
      })
    );
    
    return departmentsWithStats;
  },
});

