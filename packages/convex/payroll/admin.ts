import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Authentication is handled by middleware for admin routes

// Get payroll settings
export const getPayrollSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("payrollSettings").order("desc").first();
    return settings || null;
  },
});

// Create or update payroll settings (admin only)
export const upsertPayrollSettings = mutation({
  args: {
    payFrequency: v.union(
      v.literal('weekly'),
      v.literal('biweekly'),
      v.literal('semimonthly'),
      v.literal('monthly')
    ),
    firstPayDay: v.number(),
    standardWorkWeek: v.number(),
    overtimeMultiplier: v.number(),
    holidayOvertimeMultiplier: v.number(),
    weekendOvertimeMultiplier: v.number(),
  },
  handler: async (ctx, args) => {
    // Authentication is handled by middleware
    const settings = {
      ...args,
      updatedBy: (await ctx.auth.getUserIdentity())?.subject as Id<"users">,
      updatedAt: Date.now(),
    };

    await ctx.db.insert("payrollSettings", settings);
    return settings;
  },
});

// Get all staff payroll profiles (admin only)
export const getStaffPayrollProfiles = query({
  args: {
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('on_leave')
    )),
  },
  handler: async (ctx, args) => {
    // Authentication is handled by middleware
    let results;
    
    if (args.status) {
      results = await ctx.db.query("staffPayrollProfiles")
        .withIndex("by_status", (q) => q.eq("status", args.status as 'active' | 'inactive' | 'on_leave'))
        .order("desc")
        .collect();
    } else {
      results = await ctx.db.query("staffPayrollProfiles")
        .withIndex("by_staff")
        .order("desc")
        .collect();
    }
    return results;
  },
});

// Update staff payroll profile (admin only)
export const updateStaffPayrollProfile = mutation({
  args: {
    staffId: v.id("users"),
    hourlyRate: v.number(),
    isOvertimeEligible: v.boolean(),
    paymentMethod: v.union(
      v.literal('direct_deposit'),
      v.literal('check'),
      v.literal('other')
    ),
    bankDetails: v.optional(v.object({
      accountNumber: v.string(),
      routingNumber: v.string(),
      accountType: v.union(
        v.literal('checking'),
        v.literal('savings')
      ),
      bankName: v.string()
    })),
    taxWithholdings: v.object({
      federalAllowances: v.number(),
      stateAllowances: v.number(),
      additionalWithholding: v.number(),
      taxStatus: v.union(
        v.literal('single'),
        v.literal('married'),
        v.literal('head_of_household')
      )
    }),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('on_leave')
    ),
  },
  handler: async (ctx, args) => {
    // Authentication is handled by middleware
    const profile = await ctx.db
      .query("staffPayrollProfiles")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .first();

    if (profile) {
      // Update existing profile
      await ctx.db.patch(profile._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return ctx.db.get(profile._id);
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("staffPayrollProfiles", {
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return ctx.db.get(profileId);
    }
  },
});

// Process payroll for a specific period (admin only)
export const processPayroll = mutation({
  args: {
    periodId: v.id("payPeriods"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authentication is handled by middleware
    const period = await ctx.db.get(args.periodId);
    if (!period) {
      throw new Error("Pay period not found");
    }

    // Get all active staff
    const staffProfiles = await ctx.db
      .query("staffPayrollProfiles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Process each staff member
    for (const profile of staffProfiles) {
      // Get work sessions for this period
      const workSessions = await ctx.db
        .query("workSessions")
        .withIndex("by_staffId", (q) => q.eq("staffId", profile.staffId))
        .filter((q) => 
          q.and(
            q.gte(q.field("clockInTime"), period.startDate),
            q.lte(q.field("clockInTime"), period.endDate)
          )
        )
        .collect();

      // Calculate hours and overtime
      let totalHours = 0;
      let overtimeHours = 0;
      
      for (const session of workSessions) {
        if (session.duration) {
          const hours = session.duration / (1000 * 60 * 60);
          totalHours += hours;
          
          // Simple overtime calculation (can be enhanced)
          if (profile.isOvertimeEligible && hours > 8) {
            overtimeHours += hours - 8;
          }
        }
      }

      // Calculate pay
      const basePay = (totalHours - overtimeHours) * profile.hourlyRate;
      const overtimePay = overtimeHours * (profile.hourlyRate * 1.5); // Default 1.5x for overtime
      const grossPay = basePay + overtimePay;

      // Create pay slip
      await ctx.db.insert("paySlips", {
        staffId: profile.staffId,
        periodId: args.periodId,
        baseHours: totalHours - overtimeHours,
        overtimeHours,
        hourlyRate: profile.hourlyRate,
        grossPay,
        deductions: [], // Add standard deductions here
        bonuses: [],    // Add any bonuses here
        netPay: grossPay, // Will be updated after deductions
        status: "processing",
        paymentMethod: profile.paymentMethod,
        notes: args.notes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update pay period status
    await ctx.db.patch(period._id, {
      status: "processed",
      processedAt: Date.now(),
      processedBy: (await ctx.auth.getUserIdentity())?.subject as Id<"users">,
    });

    return { success: true, count: staffProfiles.length };
  },
});

// Get year-to-date total hours summary for admin payroll page
export const getYearToDateHoursSummary = query({
  args: {
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authentication is handled by middleware
    
    const currentYear = new Date().getFullYear();
    const targetYear = args.year || currentYear;
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear + 1, 0, 1).getTime();
    
    // Get all completed work sessions for the year
    const sessions = await ctx.db
      .query("workSessions")
      .withIndex("by_date", (q) => q.gte("clockInTime", startOfYear))
      .filter(q => q.lt(q.field("clockInTime"), endOfYear))
      .filter(q => q.eq(q.field("status"), "completed"))
      .collect();

    // Group by staff and calculate totals
    const staffHours: Record<string, { 
      totalHours: number; 
      totalMinutes: number; 
      sessions: number;
      staffName?: string;
    }> = {};
    
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

    // Get staff names for display
    for (const staffId of Object.keys(staffHours)) {
      const staff = await ctx.db.get(staffId as Id<"users">);
      if (staff) {
        staffHours[staffId].staffName = staff.name || staff.email || staffId;
      }
    }

    // Calculate overall totals
    const overallTotal = Object.values(staffHours).reduce((total, staff) => {
      return total + staff.totalHours;
    }, 0);

    // Get active staff count for comparison
    const activeStaff = await ctx.db
      .query("staffPayrollProfiles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return {
      year: targetYear,
      overallTotalHours: overallTotal,
      overallTotalHoursFormatted: overallTotal.toFixed(1),
      staffBreakdown: staffHours,
      totalSessions: sessions.length,
      activeStaffCount: activeStaff.length,
      averageHoursPerStaff: activeStaff.length > 0 ? overallTotal / activeStaff.length : 0,
    };
  },
});

// Get pay periods with filtering
// ... (additional admin endpoints for managing pay periods, viewing pay slips, etc.)
