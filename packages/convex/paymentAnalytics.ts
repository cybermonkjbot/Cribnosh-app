// @ts-nocheck
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import type { QueryCtx } from "./types/convexContexts";

// ============================================================================
// INTERNAL FUNCTIONS FOR CRON JOBS
// ============================================================================

// Internal query for getting payment dashboard stats
export const getPaymentDashboardStatsInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()) },
  returns: v.object({
    totalPayments: v.number(),
    successfulPayments: v.number(),
    failedPayments: v.number(),
    canceledPayments: v.number(),
    totalRevenue: v.number(),
    totalRefunds: v.number(),
    totalDisputes: v.number(),
    successRate: v.number(),
    failureRate: v.number(),
    refundRate: v.number(),
    disputeRate: v.number(),
    averagePaymentAmount: v.number(),
  }),
  handler: async (ctx, args) => {
    return await getPaymentDashboardStatsHandler(ctx, args);
  },
});

// Internal query for getting payment method analytics
export const getPaymentMethodAnalyticsInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()) },
  returns: v.array(v.object({
    method: v.string(),
    count: v.number(),
    revenue: v.number(),
    successRate: v.number(),
    percentage: v.number(),
  })),
  handler: async (ctx, args) => {
    return await getPaymentMethodAnalyticsHandler(ctx, args);
  },
});

// Internal query for getting payment failure reasons
export const getPaymentFailureReasonsInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()), limit: v.optional(v.number()) },
  returns: v.array(v.object({
    failureCode: v.string(),
    failureReason: v.string(),
    count: v.number(),
    percentage: v.number(),
  })),
  handler: async (ctx, args) => {
    return await getPaymentFailureReasonsHandler(ctx, args);
  },
});

// Generate daily payment reports
export const generateDailyReports = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get yesterday's date range
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    const startDate = yesterdayStart.getTime();
    const endDate = yesterdayEnd.getTime();
    
    // Fetch stats using internal queries
    const stats = await ctx.runQuery(internal.paymentAnalytics.getPaymentDashboardStatsInternal, {
      startDate,
      endDate,
    });
    
    const paymentMethods = await ctx.runQuery(internal.paymentAnalytics.getPaymentMethodAnalyticsInternal, {
      startDate,
      endDate,
    });
    
    const failureReasons = await ctx.runQuery(internal.paymentAnalytics.getPaymentFailureReasonsInternal, {
      startDate,
      endDate,
      limit: 10,
    });
    
    // Create daily report
    const report = {
      date: new Date(yesterday).toISOString().split('T')[0],
      stats,
      paymentMethods,
      failureReasons,
      generatedAt: Date.now(),
    };
    
    // Store report (you could store this in a reports table or send via email)
    console.log("Daily payment report generated:", report);
  },
});

// Internal query for getting payment health metrics
export const getPaymentHealthMetricsInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()) },
  returns: v.object({
    successRate: v.number(),
    failureRate: v.number(),
    refundRate: v.number(),
    disputeRate: v.number(),
    totalTransactions: v.number(),
    totalRevenue: v.number(),
    totalRefunds: v.number(),
    totalDisputes: v.number(),
    reputationScore: v.number(),
  }),
  handler: async (ctx, args) => {
    return await getPaymentHealthMetricsHandler(ctx, args);
  },
});

// Check payment health metrics
export const checkPaymentHealthMetrics = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    
    // Get health metrics using internal query
    const healthMetrics = await ctx.runQuery(internal.paymentAnalytics.getPaymentHealthMetricsInternal, {
      startDate: last24Hours,
    });
    
    // Check for alerts (only if there's actual payment data)
    const alerts = [];
    
    // Only check metrics if there are actual transactions
    if (healthMetrics.totalTransactions > 0) {
      if (healthMetrics.successRate < 95) {
        alerts.push({
          type: "payment_success_rate_low",
          message: `Payment success rate is ${healthMetrics.successRate}%, below threshold of 95%`,
          severity: "high" as const,
        });
      }
      
      if (healthMetrics.failureRate > 5) {
        alerts.push({
          type: "payment_failure_rate_high",
          message: `Payment failure rate is ${healthMetrics.failureRate}%, above threshold of 5%`,
          severity: "medium" as const,
        });
      }
      
      if (healthMetrics.disputeRate > 1) {
        alerts.push({
          type: "payment_dispute_rate_high",
          message: `Payment dispute rate is ${healthMetrics.disputeRate}%, above threshold of 1%`,
          severity: "critical" as const,
        });
      }
      
      if (healthMetrics.refundRate > 10) {
        alerts.push({
          type: "payment_refund_rate_high",
          message: `Payment refund rate is ${healthMetrics.refundRate}%, above threshold of 10%`,
          severity: "medium" as const,
        });
      }
    }
    
    // Create alerts (you would need to implement createPaymentAlertInternal)
    for (const alert of alerts) {
      console.log("Payment health alert:", alert);
      // await ctx.runMutation(internal.paymentAnalytics.createPaymentAlertInternal, {
      //   type: alert.type,
      //   message: alert.message,
      //   severity: alert.severity,
      //   service: "payment",
      //   details: JSON.stringify(healthMetrics),
      // });
    }
  },
});

// Cleanup old payment analytics data
export const cleanupOldPaymentAnalyticsData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Clean up old payment analytics data
    const oldAnalytics = await ctx.db
      .query("paymentAnalyticsData")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", thirtyDaysAgo))
      .collect();
    
    for (const analytics of oldAnalytics) {
      await ctx.db.delete(analytics._id);
    }
    
    console.log(`Cleaned up ${oldAnalytics.length} old payment analytics records`);
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getPaymentDashboardStatsHandler(
  ctx: QueryCtx,
  args: { startDate?: number; endDate?: number }
) {
  const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  
  const analyticsData = await ctx.db
    .query("paymentAnalyticsData")
    .withIndex("by_timestamp", (q: any) => q.gte("timestamp", startDate).lte("timestamp", endDate))
    .collect();
  
  const eventCounts = analyticsData.reduce((acc: Record<string, number>, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const successfulPayments = eventCounts["payment_intent.succeeded"] || 0;
  const failedPayments = eventCounts["payment_intent.payment_failed"] || 0;
  const canceledPayments = eventCounts["payment_intent.canceled"] || 0;
  const totalPayments = successfulPayments + failedPayments + canceledPayments;
  
  const successfulEvents = analyticsData.filter(e => e.eventType === "payment_intent.succeeded");
  const totalRevenue = successfulEvents.reduce((sum, e) => sum + e.amount, 0);
  
  const refundEvents = analyticsData.filter(e => 
    e.eventType === "charge.refunded" || e.eventType === "refund.succeeded"
  );
  const totalRefunds = refundEvents.reduce((sum, e) => sum + e.amount, 0);
  
  const totalDisputes = eventCounts["charge.dispute.created"] || 0;
  
  const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
  const failureRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0;
  const refundRate = totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 : 0;
  const disputeRate = successfulPayments > 0 ? (totalDisputes / successfulPayments) * 100 : 0;
  const averagePaymentAmount = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;
  
  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    canceledPayments,
    totalRevenue,
    totalRefunds,
    totalDisputes,
    successRate: Math.round(successRate * 100) / 100,
    failureRate: Math.round(failureRate * 100) / 100,
    refundRate: Math.round(refundRate * 100) / 100,
    disputeRate: Math.round(disputeRate * 100) / 100,
    averagePaymentAmount: Math.round(averagePaymentAmount),
  };
}

async function getPaymentMethodAnalyticsHandler(
  ctx: QueryCtx,
  args: { startDate?: number; endDate?: number }
) {
  const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  
  const analyticsData = await ctx.db
    .query("paymentAnalyticsData")
    .withIndex("by_timestamp", (q: any) => q.gte("timestamp", startDate).lte("timestamp", endDate))
    .collect();
  
  const methodStats = new Map<string, {
    method: string;
    successful: number;
    failed: number;
    revenue: number;
  }>();
  
  for (const event of analyticsData) {
    const method = event.paymentMethod || "unknown";
    
    if (!methodStats.has(method)) {
      methodStats.set(method, {
        method,
        successful: 0,
        failed: 0,
        revenue: 0,
      });
    }
    
    const stats = methodStats.get(method);
    if (stats) {
      if (event.eventType === "payment_intent.succeeded") {
        stats.successful++;
        stats.revenue += event.amount;
      } else if (event.eventType === "payment_intent.payment_failed") {
        stats.failed++;
      }
    }
  }
  
  const totalRevenue = Array.from(methodStats.values()).reduce((sum, s) => sum + s.revenue, 0);
  
  const result = Array.from(methodStats.values()).map(stats => {
    const total = stats.successful + stats.failed;
    return {
      method: stats.method,
      count: total,
      revenue: stats.revenue,
      successRate: total > 0 ? Math.round((stats.successful / total) * 10000) / 100 : 0,
      percentage: totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 10000) / 100 : 0,
    };
  });
  
  return result.sort((a, b) => b.revenue - a.revenue);
}

async function getPaymentFailureReasonsHandler(
  ctx: QueryCtx,
  args: { startDate?: number; endDate?: number; limit?: number }
) {
  const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  const limit = args.limit || 10;
  
  const failedPayments = await ctx.db
    .query("paymentAnalyticsData")
    .withIndex("by_event_type", (q: any) => q.eq("eventType", "payment_intent.payment_failed"))
    .filter((q: any) => q.and(
      q.gte(q.field("timestamp"), startDate),
      q.lte(q.field("timestamp"), endDate)
    ))
    .collect();
  
  const failureStats = new Map<string, number>();
  
  for (const event of failedPayments) {
    const key = event.failureCode || event.failureReason || "unknown";
    failureStats.set(key, (failureStats.get(key) || 0) + 1);
  }
  
  const total = failedPayments.length;
  
  const result = Array.from(failureStats.entries()).map(([key, count]) => ({
    failureCode: key,
    failureReason: key,
    count,
    percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
  }));
  
  return result
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

async function getPaymentHealthMetricsHandler(
  ctx: QueryCtx,
  args: { startDate?: number; endDate?: number }
) {
  const startDate = args.startDate || (Date.now() - 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  
  const analyticsData = await ctx.db
    .query("paymentAnalyticsData")
    .withIndex("by_timestamp", (q: any) => q.gte("timestamp", startDate).lte("timestamp", endDate))
    .collect();
  
  const successfulPayments = analyticsData.filter(e => e.eventType === "payment_intent.succeeded").length;
  const failedPayments = analyticsData.filter(e => e.eventType === "payment_intent.payment_failed").length;
  const totalPayments = successfulPayments + failedPayments;
  
  const successfulEvents = analyticsData.filter(e => e.eventType === "payment_intent.succeeded");
  const totalRevenue = successfulEvents.reduce((sum, e) => sum + e.amount, 0);
  
  const refundEvents = analyticsData.filter(e => 
    e.eventType === "charge.refunded" || e.eventType === "refund.succeeded"
  );
  const totalRefunds = refundEvents.reduce((sum, e) => sum + e.amount, 0);
  
  const totalDisputes = analyticsData.filter(e => e.eventType === "charge.dispute.created").length;
  
  const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
  const failureRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0;
  const refundRate = totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 : 0;
  const disputeRate = successfulPayments > 0 ? (totalDisputes / successfulPayments) * 100 : 0;
  
  const reputationScore = 100 - (failureRate * 0.5) - (refundRate * 0.3) - (disputeRate * 2);
  
  return {
    successRate: Math.round(successRate * 100) / 100,
    failureRate: Math.round(failureRate * 100) / 100,
    refundRate: Math.round(refundRate * 100) / 100,
    disputeRate: Math.round(disputeRate * 100) / 100,
    totalTransactions: totalPayments,
    totalRevenue,
    totalRefunds,
    totalDisputes,
    reputationScore: Math.max(0, Math.round(reputationScore * 100) / 100),
  };
}

