// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../../../apps/web/types/convex-contexts";
import type { Id } from "../_generated/dataModel";

// Time tracking entry structure
interface TimeTrackingEntry {
  _id: Id<"timelogs"> | string;
  userId: Id<"users"> | string;
  startTime: number;
  endTime?: number;
  duration?: number;
  department?: string;
  projectId?: string;
  project?: string;
  userName?: string;
  [key: string]: unknown;
}

export const createTimeTrackingReport = mutation({
  args: {
    userId: v.id("users"),
    project: v.string(),
    task: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx: MutationCtx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity?.subject) {
      throw new Error('User identity not found');
    }
    const createdBy = userIdentity.subject as Id<"users">;
    const reportId = await ctx.db.insert("timelogs", {
      user: String(args.userId),
      staffId: args.userId,
      bucket: args.project || "default",
      logs: [{
        task: args.task,
        description: args.description || "",
        startTime: args.startTime,
        endTime: args.endTime,
        duration: args.duration || 0,
        status: args.status,
      }],
      timestamp: Date.now(),
      createdBy,
      createdAt: Date.now(),
    });

    return { success: true, reportId };
  },
});

export const updateTimeTrackingReport = mutation({
  args: {
    reportId: v.id("timelogs"),
    project: v.optional(v.string()),
    task: v.optional(v.string()),
    description: v.optional(v.string()),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx: MutationCtx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Time tracking report not found");
    }
    
    const logs = report.logs || [];
    const lastLog = logs[logs.length - 1] as { task?: string; description?: string; endTime?: number; duration?: number; status?: string; [key: string]: unknown } | undefined;
    
    if (lastLog) {
      if (args.task !== undefined) lastLog.task = args.task;
      if (args.description !== undefined) lastLog.description = args.description;
      if (args.endTime !== undefined) lastLog.endTime = args.endTime;
      if (args.duration !== undefined) lastLog.duration = args.duration;
      if (args.status !== undefined) lastLog.status = args.status;
    }
    
    const updates: { bucket?: string; logs?: unknown[]; updatedAt?: number; updatedBy?: Id<"users"> } = {
      logs,
      updatedAt: Date.now(),
    };
    
    if (args.project !== undefined) {
      updates.bucket = args.project;
    }
    
    const userIdentity = await ctx.auth.getUserIdentity();
    if (userIdentity?.subject) {
      updates.updatedBy = userIdentity.subject as Id<"users">;
    }
    
    await ctx.db.patch(args.reportId, updates);

    return { success: true };
  },
});

export const deleteTimeTrackingReport = mutation({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.delete(args.reportId);
    return { success: true };
  },
});

export const startTimeTracking = mutation({
  args: {
    userId: v.id("users"),
    project: v.string(),
    task: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity?.subject) {
      throw new Error('User identity not found');
    }
    const createdBy = userIdentity.subject as Id<"users">;
    const reportId = await ctx.db.insert("timelogs", {
      user: String(args.userId),
      staffId: args.userId,
      bucket: args.project || "default",
      logs: [{
        task: args.task,
        description: args.description || "",
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        status: "in_progress",
      }],
      timestamp: Date.now(),
      createdBy,
      createdAt: Date.now(),
    });

    return { success: true, reportId };
  },
});

export const stopTimeTracking = mutation({
  args: {
    reportId: v.id("timelogs"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Time tracking report not found");
    }
    
    const endTime = Date.now();
    const logs = report.logs || [];
    const lastLog = logs[logs.length - 1] as { startTime?: number; endTime?: number; duration?: number; [key: string]: unknown } | undefined;
    const startTime = lastLog?.startTime ? lastLog.startTime : Date.now();
    const duration = endTime - startTime;
    
    // Update the last log entry
    if (lastLog) {
      lastLog.endTime = endTime;
      lastLog.duration = duration;
      lastLog.status = "completed";
    }
    
    await ctx.db.patch(args.reportId, {
      logs,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const generateTimeTrackingReport = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("custom")
    ),
    startDate: v.number(),
    endDate: v.number(),
    filters: v.object({
      users: v.optional(v.array(v.string())),
      departments: v.optional(v.array(v.string())),
      projects: v.optional(v.array(v.string()))
    })
  },
  handler: async (ctx: MutationCtx, args) => {
    // Generate a new time tracking report with real data
    const reportId = `report-${Date.now()}`;
    
    try {
      // Get time tracking entries within the date range
      const timeEntries = await ctx.db
        .query("timelogs")
        .filter((q) => 
          q.and(
            q.gte(q.field("timestamp"), args.startDate),
            q.lte(q.field("timestamp"), args.endDate)
          )
        )
        .collect();

      // Extract entries from timelogs
      const extractedEntries: TimeTrackingEntry[] = [];
      for (const log of timeEntries) {
        const logs = log.logs || [];
        for (const logEntry of logs) {
          const entry = logEntry as { startTime?: number; endTime?: number; duration?: number; task?: string; [key: string]: unknown };
          if (entry.startTime && entry.endTime && entry.startTime >= args.startDate && entry.endTime <= args.endDate) {
            extractedEntries.push({
              userId: String(log.staffId),
              startTime: entry.startTime,
              endTime: entry.endTime,
              duration: entry.duration || (entry.endTime - entry.startTime),
              project: log.bucket,
              task: entry.task as string || "",
            } as unknown as TimeTrackingEntry);
          }
        }
      }
      
      // Apply filters
      let filteredEntries = extractedEntries;
      if (args.filters.users && args.filters.users.length > 0) {
        filteredEntries = filteredEntries.filter((entry) => 
          args.filters.users?.includes(String(entry.userId))
        );
      }
      if (args.filters.departments && args.filters.departments.length > 0) {
        filteredEntries = filteredEntries.filter((entry) => 
          entry.department && args.filters.departments?.includes(entry.department)
        );
      }
      if (args.filters.projects && args.filters.projects.length > 0) {
        filteredEntries = filteredEntries.filter((entry) => 
          entry.project && args.filters.projects?.includes(entry.project)
        );
      }

      // Calculate real metrics
      const totalHours = filteredEntries.reduce((sum: number, entry) => {
        if (!entry.endTime || !entry.startTime) return sum;
        const duration = (entry.endTime - entry.startTime) / (1000 * 60 * 60); // Convert to hours
        return sum + duration;
      }, 0);

      const totalSessions = filteredEntries.length;
      const averageSessionDuration = totalSessions > 0 ? totalHours / totalSessions : 0;

      // Get user data for top users
      const userHours: Record<string, { hours: number, sessions: number, userName: string }> = {};
      filteredEntries.forEach((entry) => {
        const userId = String(entry.userId);
        if (!userHours[userId]) {
          userHours[userId] = { hours: 0, sessions: 0, userName: entry.userName || `User ${userId}` };
        }
        if (entry.endTime && entry.startTime) {
          const duration = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
          userHours[userId].hours += duration;
          userHours[userId].sessions += 1;
        }
      });

      const topUsers = Object.entries(userHours)
        .map(([userId, data]) => ({
          userId,
          userName: data.userName,
          totalHours: Math.round(data.hours * 10) / 10,
          sessions: data.sessions
        }))
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 10);

      // Calculate hourly breakdown
      const hourlyBreakdown: Record<number, { totalHours: number, activeUsers: Set<string> }> = {};
      filteredEntries.forEach((entry) => {
        if (!entry.endTime || !entry.startTime) return;
        const startHour = new Date(entry.startTime).getHours();
        const endHour = new Date(entry.endTime).getHours();
        const duration = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
        
        for (let hour = startHour; hour <= endHour; hour++) {
          if (!hourlyBreakdown[hour]) {
            hourlyBreakdown[hour] = { totalHours: 0, activeUsers: new Set() };
          }
          hourlyBreakdown[hour].totalHours += duration / (endHour - startHour + 1);
          hourlyBreakdown[hour].activeUsers.add(String(entry.userId));
        }
      });

      const hourlyData = Object.entries(hourlyBreakdown)
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          totalHours: Math.round(data.totalHours * 10) / 10,
          activeUsers: data.activeUsers.size
        }))
        .sort((a, b) => a.hour - b.hour);

      // Calculate daily breakdown
      const dailyBreakdown: Record<string, { totalHours: number, sessions: number }> = {};
      filteredEntries.forEach((entry) => {
        if (!entry.startTime) return;
        const date = new Date(entry.startTime).toISOString().split('T')[0];
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = { totalHours: 0, sessions: 0 };
        }
        if (entry.endTime && entry.startTime) {
          const duration = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
          dailyBreakdown[date].totalHours += duration;
          dailyBreakdown[date].sessions += 1;
        }
      });

      const dailyData = Object.entries(dailyBreakdown)
        .map(([date, data]) => ({
          date,
          totalHours: Math.round(data.totalHours * 10) / 10,
          sessions: data.sessions,
          productivity: Math.min(100, Math.round((data.totalHours / 8) * 100 * 10) / 10) // Assuming 8 hours is 100% productivity
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate project breakdown
      const projectBreakdown: Record<string, { totalHours: number, projectName: string }> = {};
      filteredEntries.forEach((entry) => {
        if (entry.projectId) {
          const projectId = String(entry.projectId);
          if (!projectBreakdown[projectId]) {
            projectBreakdown[projectId] = { totalHours: 0, projectName: entry.project || `Project ${projectId}` };
          }
          if (entry.endTime && entry.startTime) {
            const duration = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
            projectBreakdown[projectId].totalHours += duration;
          }
        }
      });

      const projectData = Object.entries(projectBreakdown)
        .map(([projectId, data]) => ({
          projectId,
          projectName: data.projectName,
          totalHours: Math.round(data.totalHours * 10) / 10,
          percentage: totalHours > 0 ? Math.round((data.totalHours / totalHours) * 100 * 10) / 10 : 0
        }))
        .sort((a, b) => b.totalHours - a.totalHours);

      // Calculate department breakdown
      const departmentBreakdown: Record<string, { totalHours: number, users: Set<string> }> = {};
      filteredEntries.forEach((entry) => {
        if (entry.department) {
          if (!departmentBreakdown[entry.department]) {
            departmentBreakdown[entry.department] = { totalHours: 0, users: new Set() };
          }
          if (entry.endTime && entry.startTime) {
            const duration = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
            departmentBreakdown[entry.department].totalHours += duration;
            departmentBreakdown[entry.department].users.add(String(entry.userId));
          }
        }
      });

      const departmentData = Object.entries(departmentBreakdown)
        .map(([department, data]) => ({
          department,
          totalHours: Math.round(data.totalHours * 10) / 10,
          averageHours: data.users.size > 0 ? Math.round((data.totalHours / data.users.size) * 10) / 10 : 0,
          users: data.users.size
        }))
        .sort((a, b) => b.totalHours - a.totalHours);

      const report = {
      _id: reportId,
      name: args.name,
      type: args.type,
      period: {
        start: args.startDate,
        end: args.endDate
      },
      generatedAt: Date.now(),
        generatedBy: await (async () => {
          try {
            const identity = await ctx.auth.getUserIdentity();
            if (identity?.email) {
              return identity.email;
            }
            if (identity?.tokenIdentifier) {
              const email = identity.tokenIdentifier.split(':')[1];
              if (email) return email;
            }
          } catch (error) {
            console.error('Error getting user from auth context:', error);
          }
          return 'System';
        })(),
      data: {
          totalHours: Math.round(totalHours * 10) / 10,
          totalSessions,
          averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
          productivityScore: totalHours > 0 ? Math.round((totalHours / (totalSessions * 8)) * 100 * 10) / 10 : 0,
          topUsers,
          hourlyBreakdown: hourlyData,
          dailyBreakdown: dailyData,
          projectBreakdown: projectData,
          departmentBreakdown: departmentData,
      },
      filters: args.filters
    };
    
      // Save report to database
      const userIdentity = await ctx.auth.getUserIdentity();
      if (!userIdentity?.subject) {
        throw new Error('User identity not found');
      }
      const createdBy = userIdentity.subject as Id<"users">;
      await ctx.db.insert("reports", {
        name: report.name,
        type: `timeTracking_${report.type}`,
        parameters: {
          period: report.period,
          filters: report.filters,
          generatedBy: report.generatedBy,
        },
        status: 'completed',
        createdAt: Date.now(),
        generatedAt: report.generatedAt,
        createdBy,
      });
    
    return { 
      success: true, 
      reportId,
        report
      };
    } catch (error) {
      console.error("Error generating time tracking report:", error);
      return { 
        success: false, 
        error: "Failed to generate report" 
      };
    }
  },
});

export const downloadTimeTrackingReport = mutation({
  args: {
    reportId: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    // In a real app, this would generate and return a download URL
    const downloadUrl = `/api/reports/time-tracking/${args.reportId}.pdf`;
    
    // Downloading time tracking report
    
    return { 
      success: true, 
      downloadUrl 
    };
  },
});
