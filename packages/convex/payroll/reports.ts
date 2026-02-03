// @ts-nocheck
import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { DataModel } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";

type StaffPayrollProfile = DataModel["staffPayrollProfiles"]["document"] & {
  _id: Id<"staffPayrollProfiles">;
  _creationTime: number;
};

type PaySlip = DataModel["paySlips"]["document"] & {
  _id: Id<"paySlips">;
  _creationTime: number;
  period?: PayPeriod; // Joined data
  periodId: Id<"payPeriods">;
  staffId: Id<"users">;
};

type PayPeriod = DataModel["payPeriods"]["document"] & {
  _id: Id<"payPeriods">;
  _creationTime: number;
  startDate: number;
  endDate: number;
};

// Get payroll summary report
export const getPayrollSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all pay slips with joined period data
    let paySlips: PaySlip[] = [];
    const paySlipDocs = await ctx.db.query("paySlips").collect();
    
    // Get all periods and create a map for quick lookup
    const allPeriods = await ctx.db.query("payPeriods").collect();
    const periodMap = new Map(allPeriods.map(p => [p._id, p as PayPeriod]));
    
    // Map pay slips with their period data
    for (const slip of paySlipDocs) {
      const period = periodMap.get(slip.periodId);
      paySlips.push({
        ...slip,
        period
      } as PaySlip);
    }
    
    // Filter by date range if provided
    if (args.startDate !== undefined || args.endDate !== undefined) {
      paySlips = paySlips.filter(slip => {
        // Use the joined period data
        const period = slip.period;
        if (!period) return false;
        
        if (args.startDate && period.startDate < args.startDate) return false;
        if (args.endDate && period.endDate > args.endDate) return false;
        return true;
      });
    }
    
    // Get all staff profiles and user data for department filtering and summary
    const staffProfilesList = await ctx.db.query("staffPayrollProfiles").collect();
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map(u => [u._id, u]));
    
    // Filter by department if provided
    if (args.department) {
      // Filter staff profiles by department (checking user data if needed)
      const staffInDepartment = new Set(
        staffProfilesList
          .filter(profile => {
            const user = userMap.get(profile.staffId as Id<"users">);
            // Check if user exists and has matching department
            return user && 'department' in user && user.department === args.department;
          })
          .map(profile => profile.staffId)
      );
      
      paySlips = paySlips.filter(slip => staffInDepartment.has(slip.staffId));
    }
    
    // Calculate summary statistics
    const summary = {
      totalPayroll: 0,
      totalHours: 0,
      totalOvertime: 0,
      totalEmployees: 0,
      totalDeductions: 0,
      totalBonuses: 0,
      byDepartment: {} as Record<string, {
        payroll: number;
        employees: number;
        hours: number;
        overtime: number;
      }>,
      byPayPeriod: {} as Record<string, {
        payroll: number;
        employees: number;
        startDate: number;
        endDate: number;
      }>
    };
    
    // Track unique employees
    const employeeSet = new Set<string>();
    
    // Process each pay slip
    for (const slip of paySlips) {
      const period = await ctx.db.get(slip.periodId);
      if (!period) continue;
      
      // Get staff profile for department and position info
      const staffProfile = staffProfilesList.find(p => p.staffId === slip.staffId);
      const department = staffProfile && 'department' in staffProfile 
        ? staffProfile.department as string 
        : 'Unassigned';
      
      // Update totals
      summary.totalPayroll += slip.netPay;
      summary.totalHours += slip.baseHours + slip.overtimeHours;
      summary.totalOvertime += slip.overtimeHours;
      summary.totalDeductions += slip.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
      summary.totalBonuses += slip.bonuses?.reduce((sum, b) => sum + b.amount, 0) || 0;
      
      // Track unique employees
      employeeSet.add(slip.staffId);
      
      // Update department stats
      if (!summary.byDepartment[department]) {
        summary.byDepartment[department] = {
          payroll: 0,
          employees: 0,
          hours: 0,
          overtime: 0,
        };
      }
      
      summary.byDepartment[department].payroll += slip.netPay;
      summary.byDepartment[department].hours += slip.baseHours + slip.overtimeHours;
      summary.byDepartment[department].overtime += slip.overtimeHours;
      
      // Update pay period stats
      const periodKey = `${period.startDate}-${period.endDate}`;
      if (!summary.byPayPeriod[periodKey]) {
        summary.byPayPeriod[periodKey] = {
          payroll: 0,
          employees: 0,
          startDate: period.startDate,
          endDate: period.endDate,
        };
      }
      
      summary.byPayPeriod[periodKey].payroll += slip.netPay;
    }
    
    // Update employee counts
    summary.totalEmployees = employeeSet.size;
    
    // Count employees per department
    for (const profile of staffProfilesList) {
      const department = 'department' in profile 
        ? (profile.department as string) 
        : 'Unassigned';
      if (summary.byDepartment[department]) {
        summary.byDepartment[department].employees++;
      }
    }
    
    // Count employees per pay period (simplified - in reality would need to check who worked in each period)
    for (const periodKey in summary.byPayPeriod) {
      // This is a simplification - in reality, you'd need to check work sessions
      summary.byPayPeriod[periodKey].employees = employeeSet.size;
    }
    
    return summary;
  },
});

// Get detailed payroll report
export const getPayrollDetails = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    department: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('processing'),
      v.literal('paid'),
      v.literal('cancelled')
    )),
  },
  handler: async (ctx, args) => {
    let paySlips;
    
    // Apply filters
    if (args.status) {
      paySlips = await ctx.db.query("paySlips")
        .withIndex("by_status", q => q.eq("status", args.status as 'cancelled' | 'draft' | 'paid' | 'processing'))
        .collect();
    } else {
      paySlips = await ctx.db.query("paySlips")
        .withIndex("by_staff")
        .collect();
    }
    
    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      const filtered: typeof paySlips = [];
      
      for (const slip of paySlips) {
        const period = await ctx.db.get(slip.periodId);
        if (!period) continue;
        
        const matchesStart = !args.startDate || period.endDate >= args.startDate;
        const matchesEnd = !args.endDate || period.startDate <= args.endDate;
        
        if (matchesStart && matchesEnd) {
          filtered.push(slip);
        }
      }
      
      paySlips = filtered;
    }
    
    // Get all staff profiles and users for department filtering and details
    const staffProfiles = await ctx.db.query("staffPayrollProfiles").collect();
    const users = await ctx.db.query("users").collect();
    
    // Create maps for quick lookups
    const userMap = new Map(users.map(u => [u._id, u]));
    
    // Filter by department if provided
    if (args.department) {
      const staffInDept = users
        .filter(user => user.department === args.department)
        .map(user => user._id);
        
      paySlips = paySlips.filter(slip => 
        staffInDept.includes(slip.staffId)
      );
    }
    
    // Get additional details for each pay slip
    const details = await Promise.all(paySlips.map(async (slip) => {
      const period = await ctx.db.get(slip.periodId);
      const user = userMap.get(slip.staffId);
      
      return {
        ...slip,
        period,
        employeeName: user?.name || 'Unknown',
        department: user?.department || 'Unassigned',
        position: user?.position || 'N/A',
      };
    }));
    
    return details;
  },
});

// Export payroll data for accounting
export const exportPayrollData = internalQuery({
  args: {
    format: v.union(v.literal('csv'), v.literal('json')),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get pay slips with filters
    let query = ctx.db.query("paySlips");
    
    if (args.startDate || args.endDate) {
      query = query.filter(q => {
        let condition = q.gte(q.field("createdAt"), args.startDate || 0);
        if (args.endDate) {
          condition = q.and(condition, q.lte(q.field("createdAt"), args.endDate));
        }
        return condition;
      });
    }
    
    const paySlips = await query.collect();
    
    // Get additional details
    const details = await Promise.all(paySlips.map(async (slip) => {
      const period = await ctx.db.get(slip.periodId);
      // Get user data which contains department and position
      const user = await ctx.db.get(slip.staffId);
      
      return {
        paySlipId: slip._id,
        employeeId: slip.staffId,
        employeeName: user?.name || 'Unknown',
        department: user?.department || 'Unassigned',
        position: user?.position || 'N/A',
        periodStart: period?.startDate || 0,
        periodEnd: period?.endDate || 0,
        payDate: slip.paymentDate || 0,
        status: slip.status,
        baseHours: slip.baseHours,
        overtimeHours: slip.overtimeHours,
        hourlyRate: slip.hourlyRate,
        regularPay: slip.baseHours * slip.hourlyRate,
        overtimePay: slip.overtimeHours * (slip.hourlyRate * 1.5), // Assuming 1.5x for overtime
        grossPay: slip.grossPay,
        totalDeductions: slip.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0,
        totalBonuses: slip.bonuses?.reduce((sum, b) => sum + b.amount, 0) || 0,
        netPay: slip.netPay,
        paymentMethod: slip.paymentMethod,
        notes: slip.notes || '',
      };
    }));
    
    // Format based on requested format
    if (args.format === 'csv') {
      // Convert to CSV
      if (details.length === 0) {
        return '';
      }
      
      // Get headers from first object
      const headers = Object.keys(details[0]);
      
      // Convert each object to CSV row
      const rows = details.map(obj => 
        headers.map(field => {
          const value = obj[field as keyof typeof obj];
          // Escape quotes and wrap in quotes if contains comma or quote
          const strValue = String(value ?? '').replace(/"/g, '""');
          return /[,\n"]/.test(strValue) ? `"${strValue}"` : strValue;
        }).join(',')
      );
      
      // Combine headers and rows
      return [headers.join(','), ...rows].join('\n');
    }
    
    // Default to JSON
    return details;
  },
});
