// @ts-nocheck
import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";

type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

interface PayrollSettings {
  payFrequency: PayFrequency;
  firstPayDay: number;
  standardWorkWeek: number;
  overtimeMultiplier: number;
  holidayOvertimeMultiplier: number;
  weekendOvertimeMultiplier: number;
}

// Generate pay periods based on current settings
const generatePayPeriods = internalMutation({
  args: {
    startDate: v.number(),
    monthsAhead: v.number(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("payrollSettings")
      .order("desc")
      .first() as PayrollSettings | null;
    if (!settings) {
      throw new Error("Payroll settings not found");
    }

    const periods = [];
    const endDate = new Date(args.startDate);
    endDate.setMonth(endDate.getMonth() + args.monthsAhead);
    
    let currentDate = new Date(args.startDate);
    
    while (currentDate < endDate) {
      const period = generatePayPeriod(currentDate, settings);
      
      // Check if period already exists
      const exists = await ctx.db
        .query("payPeriods")
        .withIndex("by_dates", q => 
          q.eq("startDate", period.startDate).eq("endDate", period.endDate)
        )
        .first();
      
      if (!exists) {
        const id = await ctx.db.insert("payPeriods", period);
        periods.push({ ...period, _id: id });
      } else {
        periods.push(exists);
      }
      
      // Move to next period
      currentDate = new Date(period.endDate + 1);
    }
    
    return periods;
  },
});

// Helper function to generate a single pay period
function generatePayPeriod(startDate: Date, settings: PayrollSettings) {
  const periodStart = new Date(startDate);
  const periodEnd = new Date(periodStart);
  
  switch (settings.payFrequency) {
    case 'weekly':
      periodEnd.setDate(periodStart.getDate() + 6); // 7 days including start
      break;
    case 'biweekly':
      periodEnd.setDate(periodStart.getDate() + 13); // 14 days including start
      break;
    case 'semimonthly':
      // First half of the month
      if (periodStart.getDate() === 1) {
        // First half ends on 15th
        periodEnd.setDate(15);
      } else {
        // Second half ends on last day of month
        periodEnd.setMonth(periodStart.getMonth() + 1, 0);
      }
      break;
    case 'monthly':
      periodEnd.setMonth(periodStart.getMonth() + 1);
      periodEnd.setDate(0); // Last day of current month
      break;
  }
  
  // Set end of day
  periodEnd.setHours(23, 59, 59, 999);
  
  return {
    startDate: periodStart.getTime(),
    endDate: periodEnd.getTime(),
    status: 'pending' as const,
  };
}

// Authentication is handled by middleware for admin routes

// Get pay periods with optional filtering
export const getPayPeriods = query({
  args: {
    status: v.optional(v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('processed'),
      v.literal('paid')
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;
    
    // Apply status filter if provided
    if (args.status) {
      // Use the index for status filtering
      results = await ctx.db.query("payPeriods")
        .withIndex("by_status", (q) => 
          q.eq("status", args.status as 'pending' | 'in_progress' | 'processed' | 'paid')
        )
        .order("desc")
        .collect();
    } else {
      // If no status filter, use dates index
      results = await ctx.db.query("payPeriods")
        .withIndex("by_dates")
        .order("desc")
        .collect();
    }
    
    // Apply date filters using filter() for more complex conditions
    if (args.startDate !== undefined || args.endDate !== undefined) {
      results = results.filter((period) => {
        const conditions = [];
        if (args.startDate !== undefined) {
          conditions.push(period.startDate >= args.startDate);
        }
        if (args.endDate !== undefined) {
          conditions.push(period.endDate <= args.endDate);
        }
        return conditions.every(Boolean);
      });
    }
    
    // Apply limit if provided
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    
    return results;
  },
});

// Get pay period by ID
export const getPayPeriod = query({
  args: {
    periodId: v.id("payPeriods"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const period = await ctx.db.get(args.periodId);
    if (!period) {
      throw new Error("Pay period not found");
    }
    
    // Get pay slips for this period
    const paySlips = await ctx.db
      .query("paySlips")
      .withIndex("by_period", (q: any) => q.eq("periodId", args.periodId))
      .collect();
    
    // Calculate summary
    const summary = paySlips.reduce(
      (acc, slip) => ({
        totalStaff: acc.totalStaff + 1,
        totalPay: acc.totalPay + (slip.netPay || 0),
        statusCounts: {
          ...acc.statusCounts,
          [slip.status]: (acc.statusCounts[slip.status] || 0) + 1,
        },
      }),
      {
        totalStaff: 0,
        totalPay: 0,
        statusCounts: {} as Record<string, number>,
      }
    );
    
    return {
      ...period,
      ...summary,
    };
  },
});

// Manually create a pay period (admin only)
export const createPayPeriod = mutation({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authentication is handled by middleware
    
    // Check for overlapping periods
    const overlapping = await ctx.db
      .query("payPeriods")
      .filter((q: any) => 
        q.or(
          // New period starts during an existing period
          q.and(
            q.gte(q.field("startDate"), args.startDate),
            q.lte(q.field("startDate"), args.endDate)
          ),
          // New period ends during an existing period
          q.and(
            q.gte(q.field("endDate"), args.startDate),
            q.lte(q.field("endDate"), args.endDate)
          ),
          // New period completely contains an existing period
          q.and(
            q.lte(q.field("startDate"), args.startDate),
            q.gte(q.field("endDate"), args.endDate)
          )
        )
      )
      .first();
      
    if (overlapping) {
      throw new Error("Pay period overlaps with an existing period");
    }
    
    const periodId = await ctx.db.insert("payPeriods", {
      startDate: args.startDate,
      endDate: args.endDate,
      status: 'pending',
      notes: args.notes,
    });
    
    return ctx.db.get(periodId);
  },
});

// Update pay period status (admin only)
export const updatePayPeriodStatus = mutation({
  args: {
    periodId: v.id("payPeriods"),
    status: v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('processed'),
      v.literal('paid')
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authentication is handled by middleware
    
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    if (args.status === 'processed' || args.status === 'paid') {
      updates.processedAt = Date.now();
      updates.processedBy = (await ctx.auth.getUserIdentity())?.subject;
    }
    
    if (args.notes) {
      updates.notes = args.notes;
    }
    
    await ctx.db.patch(args.periodId, updates);
    return ctx.db.get(args.periodId);
  },
});

// Generate pay periods for the next X months (cron job)
export const schedulePayPeriods = internalMutation({
  args: {
    monthsAhead: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the latest pay period
    const latestPeriod = await ctx.db
      .query("payPeriods")
      .order("desc")
      .first();
    
    // Start from the day after the latest period ends, or now if no periods exist
    const baseStartDate = latestPeriod 
      ? new Date(latestPeriod.endDate + 1)
      : new Date();
    
    // Generate pay periods directly since we can't call internal mutations via scheduler
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (args.monthsAhead || 6));
    
    // Generate periods in the current function since we can't call the internal mutation directly
    const settings = await ctx.db.query("payrollSettings").first();
    if (!settings) {
      throw new Error("Payroll settings not found");
    }
    
    let currentDate = new Date(baseStartDate);
    let periods = [];
    
    while (currentDate < endDate) {
      const period = generatePayPeriod(currentDate, settings);
      await ctx.db.insert("payPeriods", period);
      periods.push(period);
      currentDate = new Date(period.endDate + 1);
    }
    
    return { success: true, count: 1 };
  },
});
