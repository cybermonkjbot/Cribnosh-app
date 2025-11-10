import { v } from "convex/values";
import { query } from "../_generated/server";

// Get payment dashboard stats
export const getPaymentDashboardStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
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
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const endDate = args.endDate || Date.now();
    
    const analyticsData = await ctx.db
      .query("paymentAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .collect();
    
    // Count events by type
    const eventCounts = analyticsData.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const successfulPayments = eventCounts["payment_intent.succeeded"] || 0;
    const failedPayments = eventCounts["payment_intent.payment_failed"] || 0;
    const canceledPayments = eventCounts["payment_intent.canceled"] || 0;
    const totalPayments = successfulPayments + failedPayments + canceledPayments;
    
    // Calculate revenue from successful payments
    const successfulEvents = analyticsData.filter(e => e.eventType === "payment_intent.succeeded");
    const totalRevenue = successfulEvents.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate refunds
    const refundEvents = analyticsData.filter(e => 
      e.eventType === "charge.refunded" || e.eventType === "refund.succeeded"
    );
    const totalRefunds = refundEvents.reduce((sum, e) => sum + e.amount, 0);
    
    // Count disputes
    const totalDisputes = eventCounts["charge.dispute.created"] || 0;
    
    // Calculate rates
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
  },
});

// Get payment performance metrics over time
export const getPaymentPerformanceMetrics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    groupBy: v.optional(v.union(
      v.literal("hour"),
      v.literal("day"),
      v.literal("week"),
      v.literal("month")
    )),
  },
  returns: v.array(v.object({
    period: v.string(),
    successful: v.number(),
    failed: v.number(),
    canceled: v.number(),
    revenue: v.number(),
    successRate: v.number(),
  })),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    const groupBy = args.groupBy || "day";
    
    const analyticsData = await ctx.db
      .query("paymentAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .collect();
    
    // Group data by time period
    const groupedData = new Map<string, {
      period: string;
      successful: number;
      failed: number;
      canceled: number;
      revenue: number;
    }>();
    
    for (const event of analyticsData) {
      const date = new Date(event.timestamp);
      let periodKey: string;
      
      switch (groupBy) {
        case "hour":
          periodKey = date.toISOString().slice(0, 13) + ":00:00.000Z";
          break;
        case "day":
          periodKey = date.toISOString().slice(0, 10);
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().slice(0, 10);
          break;
        case "month":
          periodKey = date.toISOString().slice(0, 7);
          break;
        default:
          periodKey = date.toISOString().slice(0, 10);
      }
      
      if (!groupedData.has(periodKey)) {
        groupedData.set(periodKey, {
          period: periodKey,
          successful: 0,
          failed: 0,
          canceled: 0,
          revenue: 0,
        });
      }
      
      const data = groupedData.get(periodKey);
      if (data) {
        if (event.eventType === "payment_intent.succeeded") {
          data.successful++;
          data.revenue += event.amount;
        } else if (event.eventType === "payment_intent.payment_failed") {
          data.failed++;
        } else if (event.eventType === "payment_intent.canceled") {
          data.canceled++;
        }
      }
    }
    
    // Calculate rates and return sorted data
    const result = Array.from(groupedData.values()).map(data => ({
      ...data,
      successRate: (data.successful + data.failed + data.canceled) > 0 
        ? Math.round((data.successful / (data.successful + data.failed + data.canceled)) * 10000) / 100 
        : 0,
    }));
    
    return result.sort((a, b) => a.period.localeCompare(b.period));
  },
});

// Get payment method analytics
export const getPaymentMethodAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.array(v.object({
    method: v.string(),
    count: v.number(),
    revenue: v.number(),
    successRate: v.number(),
    percentage: v.number(),
  })),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    
    const analyticsData = await ctx.db
      .query("paymentAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .collect();
    
    // Group by payment method
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
    
    // Calculate rates and percentages
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
  },
});

// Get payment failure reasons
export const getPaymentFailureReasons = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    failureCode: v.string(),
    failureReason: v.string(),
    count: v.number(),
    percentage: v.number(),
  })),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    const limit = args.limit || 10;
    
    const failedPayments = await ctx.db
      .query("paymentAnalyticsData")
      .withIndex("by_event_type", (q) => q.eq("eventType", "payment_intent.payment_failed"))
      .filter((q) => q.and(
        q.gte(q.field("timestamp"), startDate),
        q.lte(q.field("timestamp"), endDate)
      ))
      .collect();
    
    // Group by failure code/reason
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
  },
});

// Get payment health metrics
export const getPaymentHealthMetrics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    successRate: v.number(),
    failureRate: v.number(),
    refundRate: v.number(),
    disputeRate: v.number(),
    averageProcessingTime: v.number(),
    totalTransactions: v.number(),
    totalRevenue: v.number(),
    totalRefunds: v.number(),
    totalDisputes: v.number(),
    reputationScore: v.number(),
  }),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const endDate = args.endDate || Date.now();
    
    const analyticsData = await ctx.db
      .query("paymentAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
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
    
    // Simple reputation score calculation
    const reputationScore = 100 - (failureRate * 0.5) - (refundRate * 0.3) - (disputeRate * 2);
    
    return {
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      refundRate: Math.round(refundRate * 100) / 100,
      disputeRate: Math.round(disputeRate * 100) / 100,
      averageProcessingTime: 0, // Would need to track processing times
      totalTransactions: totalPayments,
      totalRevenue,
      totalRefunds,
      totalDisputes,
      reputationScore: Math.max(0, Math.round(reputationScore * 100) / 100),
    };
  },
});

