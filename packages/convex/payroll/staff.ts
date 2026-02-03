// @ts-nocheck
import { query, internalMutation } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import type { DataModel } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { GenericQueryCtx } from "convex/server";
import type { FilterBuilder } from "convex/server";
import { ConvexError } from "convex/values";
import { requireAuth, isAdmin, isStaff } from "../utils/auth";

type PaySlip = DataModel["paySlips"]["document"] & {
  _id: Id<"paySlips">;
  _creationTime: number;
  period?: PayPeriod; // Joined data
  periodId: Id<"payPeriods">;
  staffId: Id<"users">;
  status: 'draft' | 'processing' | 'paid' | 'cancelled';
};

type PayPeriod = DataModel["payPeriods"]["document"] & {
  _id: Id<"payPeriods">;
  _creationTime: number;
  startDate: number;
  endDate: number;
  status: 'pending' | 'processing' | 'processed';
};

type WorkSession = DataModel["workSessions"]["document"] & {
  _id: Id<"workSessions">;
  _creationTime: number;
};

type UserDoc = DataModel["users"]["document"] & {
  _id: Id<"users">;
  _creationTime: number;
};

// Get current user's pay slips
export const getMyPaySlips = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('processing'),
      v.literal('paid'),
      v.literal('cancelled')
    )),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { limit?: number; status?: 'draft' | 'processing' | 'paid' | 'cancelled'; sessionToken?: string }) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get pay slips with status filter if provided
    let paySlipsQuery = ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", user._id));

    // Apply status filter if provided
    if (args.status) {
      paySlipsQuery = paySlipsQuery.filter((q) => 
        q.eq(q.field("status"), args.status!)
      );
    }
    
    // Get pay slips with ordering
    const paySlips = args.limit 
      ? await paySlipsQuery.order("desc").take(args.limit)
      : await paySlipsQuery.order("desc").collect();
    
    // Get pay periods for these slips
    const payPeriods = await Promise.all(
      Array.from(new Set(paySlips.map(slip => slip.periodId)))
        .map(periodId => ctx.db.get(periodId))
    );
    
    const periodMap = new Map(
      payPeriods
        .filter((p): p is PayPeriod => p !== null)
        .map(p => [p._id, p])
    );
    
    // Enrich pay slips with period data
    return paySlips.map(slip => ({
      ...slip,
      period: periodMap.get(slip.periodId)
    }));
  },
});

// Get pay slip details
export const getPaySlip = query({
  args: {
    paySlipId: v.id("paySlips"),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { paySlipId: Id<"paySlips">; sessionToken?: string }) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    const paySlip = await ctx.db.get(args.paySlipId) as PaySlip | null;
    if (!paySlip) {
      throw new Error("Pay slip not found");
    }

    // Users can access their own pay slips, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && paySlip.staffId !== user._id) {
      throw new Error("Access denied");
    }

    // Get the pay period details
    const payPeriod = await ctx.db.get(paySlip.periodId);
    
    // Get work sessions for this pay period
    let workSessions: WorkSession[] = [];
    if (payPeriod) {
      workSessions = await ctx.db
        .query("workSessions")
        .withIndex("by_staff_date", (q) => 
          q.eq("staffId", user._id)
        )
        .filter((q) => {
          const clockInTime = q.field("clockInTime");
          return q.and(
            q.gte(clockInTime, payPeriod.startDate),
            q.lte(clockInTime, payPeriod.endDate)
          );
        })
        .order("desc")
        .collect();
    }

    if (!payPeriod) {
      throw new Error("Pay period not found");
    }

    return {
      ...paySlip,
      payPeriod,
      workSessions: workSessions || [],
    };
  },
});

// Get work history with optional date range
export const getMyWorkHistory = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { startDate?: number; endDate?: number; limit?: number; sessionToken?: string }) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get user data for department/position
    const userDoc = await ctx.db.get(user._id) as UserDoc | null;
    
    // Create base query
    let workSessionsQuery = ctx.db
      .query("workSessions")
      .withIndex("by_staff_date", (q) => 
        q.eq("staffId", user._id)
      )

      
    // Apply date filters if provided
    if (args.startDate || args.endDate) {
      workSessionsQuery = workSessionsQuery.filter((q) => {
        const clockInTime = q.field("clockInTime");
        const conditions = [];
        
        if (args.startDate) {
          conditions.push(q.gte(clockInTime, args.startDate));
        }
        if (args.endDate) {
          conditions.push(q.lte(clockInTime, args.endDate));
        }
        
        return q.and(...conditions);
      });
    }

    // Apply ordering and limit
    // Apply limit if provided and collect results
    const workSessions = args.limit 
      ? await workSessionsQuery.take(args.limit)
      : await workSessionsQuery.collect();

    // Create a type-safe result with the session and user data
    type WorkSessionWithUserInfo = typeof workSessions[number] & {
      department: string;
      position: string;
    };
    
    return workSessions.map((session: WorkSession) => {
      // Create a new object with the session data
      const result: any = { ...session };
      
      // Add department and position from user if available
      if (userDoc) {
        result.department = userDoc.department || 'Unassigned';
        result.position = userDoc.position || 'N/A';
      } else {
        result.department = 'Unassigned';
        result.position = 'N/A';
      }
      
      return result as WorkSessionWithUserInfo;
    });
  },
});

// Get current pay period information
export const getCurrentPayPeriod = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Require staff authentication
    const { requireStaff } = await import("../utils/auth");
    await requireStaff(ctx, args.sessionToken);

    // Get payroll settings to determine pay period
    const settings = await ctx.db
      .query("payrollSettings")
      .order("desc")
      .first();
    if (!settings) {
      throw new Error("Payroll settings not found");
    }

    // Get current date in milliseconds
    const now = Date.now();
    
    // Find the current pay period (where now is between start and end dates)
    const currentPeriod = await ctx.db
      .query("payPeriods")
      .filter((q) => {
        const startDate = q.field("startDate");
        const endDate = q.field("endDate");
        return q.and(
          q.lte(startDate, now),
          q.gte(endDate, now)
        );
      })
      .order("desc")
      .first();

    // Get the most recent past period and the next upcoming period
    const [previousPeriod, nextPeriod] = await Promise.all([
      // Most recent past period
      ctx.db
        .query("payPeriods")
        .filter((q) => 
          q.lte(q.field("endDate"), now)
        )
        .order("desc")
        .first(),
      
      // Next upcoming period (either after current or after last)
      currentPeriod
        ? ctx.db
            .query("payPeriods")
            .filter((q) => 
              q.gt(q.field("startDate"), currentPeriod.endDate)
            )
            .order("asc")
            .first()
        : ctx.db
            .query("payPeriods")
            .filter((q) => 
              q.gt(q.field("startDate"), now)
            )
            .order("asc")
            .first()
    ]);

    return {
      current: currentPeriod || null,
      previous: previousPeriod || null,
      next: nextPeriod || null,
    };
  },
});

// Types for the payroll profile response
type PayrollProfileResponse = {
  staffId: Id<"users">;
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  hireDate?: number | null;
  hourlyRate: number;
  isOvertimeEligible: boolean;
  paymentMethod: string;
  bankDetails?: {
    bankName: string;
    lastFour: string;
    accountType: string;
  } | null;
  lastPayDate?: number | null;
  lastPayAmount: number;
  ytdEarnings: number;
  ytdTaxes: number;
  nextPayday: number;
  taxWithholdings: Record<string, any>;
  _creationTime: number;
  _id: Id<"staffPayrollProfiles">;
};

// Get payroll profile for a staff member
export const getPayrollProfile = query({
  args: {
    staffId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<PayrollProfileResponse> => {
    // Require authentication
    const authUser = await requireAuth(ctx, args.sessionToken);
    
    // Users can access their own payroll profile, staff/admin can access any
    if (!isAdmin(authUser) && !isStaff(authUser) && args.staffId !== authUser._id) {
      throw new ConvexError("Access denied");
    }

    // Get the staff member's basic info
    const targetUser = await ctx.db.get(args.staffId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    // Get the payroll profile
    const payrollProfile = await ctx.db
      .query("staffPayrollProfiles")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .first();

    if (!payrollProfile) {
      throw new ConvexError("Payroll profile not found");
    }

    // Get the latest payslip if available
    const latestPayslip = await ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .order("desc")
      .first();

    // Get YTD earnings
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    
    // Get all payslips for the current year
    const allPayslips = await ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .collect();

    // Filter payslips for current year
    const ytdEarnings = allPayslips.filter(payslip => payslip.paymentDate && payslip.paymentDate >= startOfYear);
    const totalYtdEarnings = ytdEarnings.reduce((sum, payslip) => sum + (payslip.netPay || 0), 0);

    // Get next payday (simplified - would need actual pay schedule logic)
    const nextPayday = new Date();
    nextPayday.setDate(nextPayday.getDate() + (5 - nextPayday.getDay() + 7) % 7); // Next Friday
    
    // Extract last 4 digits of account number if available
    const lastFour = payrollProfile.bankDetails?.accountNumber 
      ? payrollProfile.bankDetails.accountNumber.slice(-4) 
      : '****';

    return {
      staffId: args.staffId,
      employeeId: targetUser.employeeId || 'N/A',
      fullName: targetUser.name || 'Unknown',
      email: targetUser.email || '',
      // Optional fields with fallbacks
      ...(targetUser.position && { jobTitle: targetUser.position }),
      ...(targetUser.department && { department: targetUser.department }),
      ...(targetUser.startDate && { hireDate: new Date(targetUser.startDate).getTime() }),
      
      // Payroll details
      hourlyRate: payrollProfile.hourlyRate,
      isOvertimeEligible: payrollProfile.isOvertimeEligible || false,
      paymentMethod: payrollProfile.paymentMethod || 'direct_deposit',
      ...(payrollProfile.bankDetails && {
        bankDetails: {
          bankName: payrollProfile.bankDetails.bankName || 'Unknown Bank',
          lastFour,
          accountType: payrollProfile.bankDetails.accountType || 'checking',
        }
      }),
      
      // Latest payslip info
      ...(latestPayslip && {
        lastPayDate: latestPayslip.paymentDate || null,
        lastPayAmount: latestPayslip.netPay || 0,
      }),
      lastPayAmount: latestPayslip?.netPay || 0,
      
      // YTD summary
      ytdEarnings: totalYtdEarnings,
      ytdTaxes: ytdEarnings.reduce((sum, payslip) => 
        sum + ((payslip.deductions || []).reduce((dSum: number, d: any) => 
          d.type === 'tax' ? dSum + (d.amount || 0) : dSum, 0) || 0), 0),
      
      // Next payment info
      nextPayday: nextPayday.getTime(),
      
      // Tax information
      taxWithholdings: payrollProfile.taxWithholdings || {},
      
      _creationTime: payrollProfile._creationTime,
      _id: payrollProfile._id,
    };
  },
});

// Types for paginated results
type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
};

// Types for payslip list item
type PayslipListItem = {
  _id: Id<"paySlips">;
  _creationTime: number;
  periodId: Id<"payPeriods">;
  startDate: number;
  endDate: number;
  status: 'draft' | 'processing' | 'paid' | 'cancelled';
  paymentDate?: number;
  grossPay: number;
  netPay: number;
  period?: {
    startDate: number;
    endDate: number;
  };
};

// Get paginated list of payslips for a staff member
export const getPayslips = query({
  args: {
    staffId: v.id("users"),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('processing'),
      v.literal('paid'),
      v.literal('cancelled')
    )),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<PaginatedResult<PayslipListItem>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Verify the user is requesting their own data or is an admin
    if (identity.subject !== args.staffId && identity.tokenIdentifier !== 'admin') {
      throw new ConvexError("Unauthorized access to payslips");
    }

    const page = args.page || 1;
    const pageSize = args.pageSize || 10;
    const offset = (page - 1) * pageSize;

    // Build the query
    let queryBuilder = ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId));

    // Apply status filter if provided
    if (args.status) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Apply year filter if provided
    if (args.year) {
      const startOfYear = new Date(args.year, 0, 1).getTime();
      const endOfYear = new Date(args.year + 1, 0, 1).getTime();
      
      queryBuilder = queryBuilder.filter((q) => 
        q.and(
          q.gte(q.field("paymentDate"), startOfYear),
          q.lt(q.field("paymentDate"), endOfYear)
        )
      );
    }

    // Get all results and apply pagination manually
    const allPayslips = await queryBuilder
      .order("desc")
      .collect();

    // Apply pagination
    const totalItems = allPayslips.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const payslips = allPayslips.slice(offset, offset + pageSize);

    // Fetch associated period info for each payslip
    const payslipsWithPeriods = await Promise.all(
      payslips.map(async (payslip) => {
        const period = await ctx.db.get(payslip.periodId) as PayPeriod | null;
        return {
          _id: payslip._id,
          _creationTime: payslip._creationTime,
          periodId: payslip.periodId,
          status: payslip.status,
          paymentDate: payslip.paymentDate,
          grossPay: payslip.grossPay,
          netPay: payslip.netPay,
          startDate: period?.startDate || 0,
          endDate: period?.endDate || 0,
          period: period ? {
            startDate: period.startDate,
            endDate: period.endDate,
          } : undefined,
        };
      })
    );

    return {
      items: payslipsWithPeriods,
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    };
  },
});

// Type for tax document
// Note: Tax documents are managed via the taxDocuments table in mutations/payroll.ts

// Type for year-to-date summary
type YearToDateSummary = {
  staffId: Id<"users">;
  year: number;
  grossEarnings: number;
  netEarnings: number;
  taxesWithheld: number;
  otherDeductions: number;
  benefits: number;
  payPeriods: number;
  averageHoursPerPeriod: number;
  averageGrossPay: number;
  averageNetPay: number;
  lastUpdated: number;
  breakdownByType: Record<string, {
    amount: number;
    count: number;
  }>;
};

// Get year-to-date summary for a staff member
export const getYearToDateSummary = query({
  args: {
    staffId: v.id("users"),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<YearToDateSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Verify the user is requesting their own data or is an admin
    if (identity.subject !== args.staffId && identity.tokenIdentifier !== 'admin') {
      throw new ConvexError("Unauthorized access to year-to-date summary");
    }

    const currentYear = new Date().getFullYear();
    const targetYear = args.year || currentYear;
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear + 1, 0, 1).getTime();
    const now = Date.now();

    // Get all payslips for the year
    const payslips = await ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .filter((q) => 
        q.and(
          q.gte(q.field("paymentDate"), startOfYear),
          q.lt(q.field("paymentDate"), endOfYear)
        )
      )
      .collect();

    // Calculate summary values
    const summary: Omit<YearToDateSummary, 'staffId' | 'year' | 'lastUpdated'> & { breakdownByType: Record<string, { amount: number; count: number }> } = {
      grossEarnings: 0,
      netEarnings: 0,
      taxesWithheld: 0,
      otherDeductions: 0,
      benefits: 0,
      payPeriods: 0,
      averageHoursPerPeriod: 0,
      averageGrossPay: 0,
      averageNetPay: 0,
      breakdownByType: {}
    };

    let totalHours = 0;
    
    // Process each payslip
    for (const payslip of payslips) {
      // Skip if not paid or processed
      if (payslip.status !== 'paid') continue;

      summary.grossEarnings += payslip.grossPay || 0;
      summary.netEarnings += payslip.netPay || 0;
      
      // Calculate hours
      const hours = (payslip.baseHours || 0) + (payslip.overtimeHours || 0);
      totalHours += hours;
      
      // Process deductions
      if (payslip.deductions && payslip.deductions.length > 0) {
        for (const deduction of payslip.deductions) {
          if (!deduction.type || !deduction.amount) continue;
          
          // Initialize breakdown type if it doesn't exist
          if (!summary.breakdownByType[deduction.type]) {
            summary.breakdownByType[deduction.type] = { amount: 0, count: 0 };
          }
          
          summary.breakdownByType[deduction.type].amount += deduction.amount;
          summary.breakdownByType[deduction.type].count++;
          
          // Categorize deductions
          if (deduction.type.toLowerCase().includes('tax')) {
            summary.taxesWithheld += deduction.amount;
          } else {
            summary.otherDeductions += deduction.amount;
            
            // Consider some deductions as benefits (e.g., 401k, health insurance)
            if ([
              '401k', 'retirement', 'health', 'dental', 'vision', 
              'hsa', 'fsa', 'insurance'
            ].some(term => deduction.type.toLowerCase().includes(term))) {
              summary.benefits += deduction.amount;
            }
          }
        }
      }
      
      summary.payPeriods++;
    }
    
    // Calculate averages
    if (summary.payPeriods > 0) {
      summary.averageHoursPerPeriod = totalHours / summary.payPeriods;
      summary.averageGrossPay = summary.grossEarnings / summary.payPeriods;
      summary.averageNetPay = summary.netEarnings / summary.payPeriods;
    }
    
    return {
      staffId: args.staffId,
      year: targetYear,
      ...summary,
      lastUpdated: now,
    };
  },
});

// Get year-to-date earnings summary
export const getYtdEarnings = query({
  handler: async (ctx: QueryCtx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current year
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    // Get all paid pay slips for current year
    const paySlips = await ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", identity.subject as Id<"users">))
      .filter((q) => {
        const status = q.field("status");
        const createdAt = q.field("createdAt");
        return q.and(
          q.eq(status, "paid"),
          q.gte(createdAt, yearStart)
        );
      })
      .collect();

    // Calculate totals with proper type safety
    const initialTotals = {
      grossPay: 0,
      netPay: 0,
      deductions: 0,
      bonuses: 0,
      hoursWorked: 0,
      overtimeHours: 0,
    };

    const totals = paySlips.reduce((acc, slip) => {
      const slipDeductions = slip.deductions?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) || 0;
      const slipBonuses = slip.bonuses?.reduce((sum: number, b: any) => sum + (b.amount || 0), 0) || 0;
      
      return {
        grossPay: acc.grossPay + (slip.grossPay || 0),
        netPay: acc.netPay + (slip.netPay || 0),
        deductions: acc.deductions + slipDeductions,
        bonuses: acc.bonuses + slipBonuses,
        hoursWorked: acc.hoursWorked + (slip.baseHours || 0) + (slip.overtimeHours || 0),
        overtimeHours: acc.overtimeHours + (slip.overtimeHours || 0),
      };
    }, initialTotals);

    // Get user's hourly rate for additional calculations if needed
    const userProfile = await ctx.db
      .query("staffPayrollProfiles")
      .withIndex("by_staff", (q) => q.eq("staffId", identity.subject as Id<"users">))
      .first();

    return {
      year: now.getFullYear(),
      paySlipCount: paySlips.length,
      hourlyRate: userProfile?.hourlyRate || 0,
      ...totals,
    };
  },
});

// Get tax documents for staff
export const getTaxDocuments = query({
  args: {
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from identity
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Build query for tax documents
    let queryBuilder = ctx.db
      .query("taxDocuments")
      .withIndex("by_employee", (q) => q.eq("employeeId", user._id));

    // Filter by year if provided
    if (args.year) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("taxYear"), args.year));
    }

    const taxDocuments = await queryBuilder.collect();

    return taxDocuments.map(doc => ({
      _id: doc._id,
      _creationTime: doc._creationTime,
      documentType: doc.documentType,
      taxYear: doc.taxYear,
      status: doc.status,
      fileUrl: doc.fileUrl,
      generatedAt: doc.generatedAt,
      sentAt: doc.sentAt,
      downloadedAt: doc.downloadedAt,
      errorMessage: doc.errorMessage
    }));
  },
});

// --- Session-token based variants for staff portal (bypass ctx.auth) ---

async function getUserBySessionToken(ctx: GenericQueryCtx<DataModel>, sessionToken: string) {
  const user = await ctx.db
    .query('users')
    .filter((q) => q.eq(q.field('sessionToken'), sessionToken))
    .first();
  if (!user || !user.sessionExpiry || user.sessionExpiry < Date.now()) {
    throw new ConvexError('Not authenticated');
  }
  return user as unknown as UserDoc;
}

export const getPayrollProfileBySession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args): Promise<PayrollProfileResponse | null> => {
    const user = await getUserBySessionToken(ctx as unknown as GenericQueryCtx<DataModel>, args.sessionToken);

    // Inline logic from getPayrollProfile without ctx.auth checks
    const staffId = user._id as Id<'users'>;

    const payrollProfile = await ctx.db
      .query("staffPayrollProfiles")
      .withIndex("by_staff", (q) => q.eq("staffId", staffId))
      .first();

    if (!payrollProfile) {
      // Return null so clients can render a friendly empty state
      return null;
    }

    const latestPayslip = await ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", staffId))
      .order("desc")
      .first();

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const allPayslips = await ctx.db
      .query("paySlips")
      .withIndex("by_staff", (q) => q.eq("staffId", staffId))
      .collect();

    const ytdEarnings = allPayslips.filter(
      (p) => p.paymentDate && p.paymentDate >= startOfYear
    );
    const totalYtdEarnings = ytdEarnings.reduce((sum, p) => sum + (p.netPay || 0), 0);

    const nextPayday = new Date();
    nextPayday.setDate(nextPayday.getDate() + ((5 - nextPayday.getDay() + 7) % 7));

    const lastFour = payrollProfile.bankDetails?.accountNumber
      ? payrollProfile.bankDetails.accountNumber.slice(-4)
      : '****';

    return {
      staffId,
      employeeId: (user as any).employeeId || 'N/A',
      fullName: (user as any).name || 'Unknown',
      email: (user as any).email || '',
      ...((user as any).position && { jobTitle: (user as any).position }),
      ...((user as any).department && { department: (user as any).department }),
      ...((user as any).startDate && { hireDate: new Date((user as any).startDate).getTime() }),

      hourlyRate: payrollProfile.hourlyRate,
      isOvertimeEligible: payrollProfile.isOvertimeEligible || false,
      paymentMethod: payrollProfile.paymentMethod || 'direct_deposit',
      ...(payrollProfile.bankDetails && {
        bankDetails: {
          bankName: payrollProfile.bankDetails.bankName || 'Unknown Bank',
          lastFour,
          accountType: payrollProfile.bankDetails.accountType || 'checking',
        },
      }),

      ...(latestPayslip && {
        lastPayDate: latestPayslip.paymentDate || null,
        lastPayAmount: latestPayslip.netPay || 0,
      }),
      lastPayAmount: latestPayslip?.netPay || 0,

      ytdEarnings: totalYtdEarnings,
      ytdTaxes: ytdEarnings.reduce(
        (sum, p) => sum + ((p.deductions || []).reduce((dSum: number, d: any) => (d.type === 'tax' ? dSum + (d.amount || 0) : dSum), 0) || 0),
        0
      ),

      nextPayday: nextPayday.getTime(),
      taxWithholdings: payrollProfile.taxWithholdings || {},
      _creationTime: payrollProfile._creationTime,
      _id: payrollProfile._id,
    };
  },
});

export const getPayslipsBySession = query({
  args: {
    sessionToken: v.string(),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('processing'),
      v.literal('paid'),
      v.literal('cancelled')
    )),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<PaginatedResult<PayslipListItem>> => {
    const user = await getUserBySessionToken(ctx as unknown as GenericQueryCtx<DataModel>, args.sessionToken);
    const staffId = user._id as Id<'users'>;

    const page = args.page || 1;
    const pageSize = args.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let queryBuilder = ctx.db
      .query('paySlips')
      .withIndex('by_staff', (q) => q.eq('staffId', staffId));

    if (args.status) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field('status'), args.status));
    }

    if (args.year) {
      const startOfYear = new Date(args.year, 0, 1).getTime();
      const endOfYear = new Date(args.year + 1, 0, 1).getTime();
      queryBuilder = queryBuilder.filter((q) => q.and(
        q.gte(q.field('paymentDate'), startOfYear),
        q.lt(q.field('paymentDate'), endOfYear),
      ));
    }

    const allPayslips = await queryBuilder.order('desc').collect();
    const totalItems = allPayslips.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const payslips = allPayslips.slice(offset, offset + pageSize);

    const payslipsWithPeriods = await Promise.all(
      payslips.map(async (p) => {
        const period = await ctx.db.get(p.periodId) as PayPeriod | null;
        return {
          _id: p._id,
          _creationTime: p._creationTime,
          periodId: p.periodId,
          status: p.status,
          paymentDate: p.paymentDate,
          grossPay: p.grossPay,
          netPay: p.netPay,
          startDate: period?.startDate || 0,
          endDate: period?.endDate || 0,
          period: period ? { startDate: period.startDate, endDate: period.endDate } : undefined,
        } as PayslipListItem;
      })
    );

    return { items: payslipsWithPeriods, page, pageSize, totalItems, totalPages, hasMore: page < totalPages };
  },
});

export const getYearToDateSummaryBySession = query({
  args: { sessionToken: v.string(), year: v.optional(v.number()) },
  handler: async (ctx, args): Promise<YearToDateSummary> => {
    const user = await getUserBySessionToken(ctx as unknown as GenericQueryCtx<DataModel>, args.sessionToken);
    const staffId = user._id as Id<'users'>;

    const currentYear = new Date().getFullYear();
    const targetYear = args.year || currentYear;
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear + 1, 0, 1).getTime();
    const now = Date.now();

    const payslips = await ctx.db
      .query('paySlips')
      .withIndex('by_staff', (q) => q.eq('staffId', staffId))
      .filter((q) => q.and(
        q.gte(q.field('paymentDate'), startOfYear),
        q.lt(q.field('paymentDate'), endOfYear),
      ))
      .collect();

    const summary: Omit<YearToDateSummary, 'staffId' | 'year' | 'lastUpdated'> & { breakdownByType: Record<string, { amount: number; count: number }> } = {
      grossEarnings: 0,
      netEarnings: 0,
      taxesWithheld: 0,
      otherDeductions: 0,
      benefits: 0,
      payPeriods: 0,
      averageHoursPerPeriod: 0,
      averageGrossPay: 0,
      averageNetPay: 0,
      breakdownByType: {},
    };

    let totalHours = 0;
    for (const p of payslips) {
      if (p.status !== 'paid') continue;
      summary.grossEarnings += p.grossPay || 0;
      summary.netEarnings += p.netPay || 0;
      const hours = (p.baseHours || 0) + (p.overtimeHours || 0);
      totalHours += hours;
      if (p.deductions && p.deductions.length > 0) {
        for (const d of p.deductions) {
          if (!d.type || !d.amount) continue;
          if (!summary.breakdownByType[d.type]) {
            summary.breakdownByType[d.type] = { amount: 0, count: 0 };
          }
          summary.breakdownByType[d.type].amount += d.amount;
          summary.breakdownByType[d.type].count++;
          if (d.type.toLowerCase().includes('tax')) {
            summary.taxesWithheld += d.amount;
          } else {
            summary.otherDeductions += d.amount;
            if ([
              '401k', 'retirement', 'health', 'dental', 'vision',
              'hsa', 'fsa', 'insurance',
            ].some((term) => d.type.toLowerCase().includes(term))) {
              summary.benefits += d.amount;
            }
          }
        }
      }
      summary.payPeriods++;
    }

    if (summary.payPeriods > 0) {
      summary.averageHoursPerPeriod = totalHours / summary.payPeriods;
      summary.averageGrossPay = summary.grossEarnings / summary.payPeriods;
      summary.averageNetPay = summary.netEarnings / summary.payPeriods;
    }

    return { staffId, year: targetYear, ...summary, lastUpdated: now };
  },
});

export const getTaxDocumentsBySession = query({
  args: { sessionToken: v.string(), year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getUserBySessionToken(ctx, args.sessionToken);

    // Build query for tax documents
    let queryBuilder = ctx.db
      .query("taxDocuments")
      .withIndex("by_employee", (q) => q.eq("employeeId", user._id));

    // Filter by year if provided
    if (args.year) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("taxYear"), args.year));
    }

    const taxDocuments = await queryBuilder.collect();

    return taxDocuments.map(doc => ({
      _id: doc._id,
      _creationTime: doc._creationTime,
      documentType: doc.documentType,
      taxYear: doc.taxYear,
      status: doc.status,
      fileUrl: doc.fileUrl,
      generatedAt: doc.generatedAt,
      sentAt: doc.sentAt,
      downloadedAt: doc.downloadedAt,
      errorMessage: doc.errorMessage
    }));
  },
});
