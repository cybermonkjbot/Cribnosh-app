import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./types/convexContexts";
import type { DeviceAnalyticsStats, EmailAnalyticsData, EmailHealthMetrics, EmailTemplate, EmailTestResults } from "./types/email";

// ============================================================================
// EMAIL ANALYTICS DASHBOARD
// ============================================================================

export const getEmailDashboardStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    templateId: v.optional(v.string()),
  },
  returns: v.object({
    totalEmails: v.number(),
    sentEmails: v.number(),
    deliveredEmails: v.number(),
    openedEmails: v.number(),
    clickedEmails: v.number(),
    bouncedEmails: v.number(),
    unsubscribedEmails: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
    unsubscribeRate: v.number(),
    deliveryRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const endDate = args.endDate || Date.now();
    
    if (args.templateId) {
      const analyticsData = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .filter((q) => q.and(
          q.gte(q.field("timestamp"), startDate),
          q.lte(q.field("timestamp"), endDate)
        ))
        .collect();
      
      // Count events by type
      const eventCounts = analyticsData.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const sentEmails = eventCounts.sent || 0;
      const deliveredEmails = eventCounts.delivered || 0;
      const openedEmails = eventCounts.opened || 0;
      const clickedEmails = eventCounts.clicked || 0;
      const bouncedEmails = eventCounts.bounced || 0;
      const unsubscribedEmails = eventCounts.unsubscribed || 0;
      
      const totalEmails = sentEmails;
      const openRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0;
      const clickRate = totalEmails > 0 ? (clickedEmails / totalEmails) * 100 : 0;
      const bounceRate = totalEmails > 0 ? (bouncedEmails / totalEmails) * 100 : 0;
      const unsubscribeRate = totalEmails > 0 ? (unsubscribedEmails / totalEmails) * 100 : 0;
      const deliveryRate = totalEmails > 0 ? (deliveredEmails / totalEmails) * 100 : 0;
      
      return {
        totalEmails,
        sentEmails,
        deliveredEmails,
        openedEmails,
        clickedEmails,
        bouncedEmails,
        unsubscribedEmails,
        openRate,
        clickRate,
        bounceRate,
        unsubscribeRate,
        deliveryRate,
      };
    }
    
    const analyticsData = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .collect();
    
    // Count events by type
    const eventCounts = analyticsData.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sentEmails = eventCounts.sent || 0;
    const deliveredEmails = eventCounts.delivered || 0;
    const openedEmails = eventCounts.opened || 0;
    const clickedEmails = eventCounts.clicked || 0;
    const bouncedEmails = eventCounts.bounced || 0;
    const unsubscribedEmails = eventCounts.unsubscribed || 0;
    
    // Calculate rates
    const openRate = sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0;
    const clickRate = sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0;
    const bounceRate = sentEmails > 0 ? (bouncedEmails / sentEmails) * 100 : 0;
    const unsubscribeRate = sentEmails > 0 ? (unsubscribedEmails / sentEmails) * 100 : 0;
    const deliveryRate = sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0;
    
    return {
      totalEmails: sentEmails,
      sentEmails,
      deliveredEmails,
      openedEmails,
      clickedEmails,
      bouncedEmails,
      unsubscribedEmails,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    };
  },
});

export const getEmailPerformanceMetrics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    templateId: v.optional(v.string()),
    groupBy: v.optional(v.union(
      v.literal("hour"),
      v.literal("day"),
      v.literal("week"),
      v.literal("month")
    )),
  },
  returns: v.array(v.object({
    period: v.string(),
    sent: v.number(),
    delivered: v.number(),
    opened: v.number(),
    clicked: v.number(),
    bounced: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
  })),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    const groupBy = args.groupBy || "day";
    
    if (args.templateId) {
      const analyticsData = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .filter((q) => q.and(
          q.gte(q.field("timestamp"), startDate),
          q.lte(q.field("timestamp"), endDate)
        ))
        .collect();
      
      // Group data by time period
      const groupedData = groupAnalyticsByPeriod(analyticsData, groupBy);
      // Ensure all required fields are present and non-optional
      return groupedData.map(data => ({
        period: data.period,
        sent: data.sent || 0,
        delivered: data.delivered || 0,
        opened: data.opened || 0,
        clicked: data.clicked || 0,
        bounced: data.bounced || 0,
        openRate: data.openRate || 0,
        clickRate: data.clickRate || 0,
        bounceRate: data.bounceRate || 0,
      }));
    }
    
    const analyticsData = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .collect();
    
    // Group data by time period
    const groupedData = new Map<string, {
      period: string;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      [key: string]: string | number;
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
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        });
      }
      
      const data = groupedData.get(periodKey);
      if (data) {
        const eventType = event.eventType;
        if (eventType in data) {
          (data[eventType as keyof typeof data] as number) = ((data[eventType as keyof typeof data] as number) || 0) + 1;
        }
      }
    }
    
    // Calculate rates and return sorted data
    const result = Array.from(groupedData.values()).map(data => ({
      ...data,
      openRate: data.sent > 0 ? Math.round((data.opened / data.sent) * 10000) / 100 : 0,
      clickRate: data.sent > 0 ? Math.round((data.clicked / data.sent) * 10000) / 100 : 0,
      bounceRate: data.sent > 0 ? Math.round((data.bounced / data.sent) * 10000) / 100 : 0,
    }));
    
    return result.sort((a, b) => a.period.localeCompare(b.period));
  },
});

export const getTopTemplates = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    templateId: v.string(),
    templateName: v.string(),
    sent: v.number(),
    opened: v.number(),
    clicked: v.number(),
    bounced: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
  })),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    const limit = args.limit || 10;
    
    const analyticsData = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .collect();
    
    // Group by template
    const templateStats = new Map<string, {
      templateId: string;
      templateName: string;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
      [key: string]: string | number;
    }>();
    
    for (const event of analyticsData) {
      if (!templateStats.has(event.templateId)) {
        templateStats.set(event.templateId, {
          templateId: event.templateId,
          templateName: event.templateId, // Would need to join with templates table
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0,
        });
      }
      
      const stats = templateStats.get(event.templateId);
      if (stats) {
        const eventType = event.eventType;
        if (eventType in stats) {
          (stats[eventType as keyof typeof stats] as number) = ((stats[eventType as keyof typeof stats] as number) || 0) + 1;
        }
      }
    }
    
    // Calculate rates and sort
    const result = Array.from(templateStats.values()).map(stats => ({
      ...stats,
      openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 10000) / 100 : 0,
      clickRate: stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 10000) / 100 : 0,
      bounceRate: stats.sent > 0 ? Math.round((stats.bounced / stats.sent) * 10000) / 100 : 0,
    }));
    
    return result
      .sort((a, b) => b.sent - a.sent)
      .slice(0, limit);
  },
});

export const getDeviceAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    templateId: v.optional(v.string()),
  },
  returns: v.object({
    devices: v.array(v.object({
      type: v.string(),
      count: v.number(),
      percentage: v.number(),
    })),
    clients: v.array(v.object({
      name: v.string(),
      count: v.number(),
      percentage: v.number(),
    })),
    browsers: v.array(v.object({
      name: v.string(),
      count: v.number(),
      percentage: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    
    if (args.templateId) {
      const analyticsData = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .filter((q) => q.and(
          q.gte(q.field("timestamp"), startDate),
          q.lte(q.field("timestamp"), endDate),
          q.neq(q.field("deviceInfo"), undefined)
        ))
        .collect();
      
      const deviceCounts = new Map<string, number>();
      const clientCounts = new Map<string, number>();
      const browserCounts = new Map<string, number>();
      
      for (const event of analyticsData) {
        if (event.deviceInfo) {
          // Count device types
          const deviceType = event.deviceInfo.type || "unknown";
          deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
          
          // Count email clients
          const client = event.deviceInfo.client || "unknown";
          clientCounts.set(client, (clientCounts.get(client) || 0) + 1);
          
          // Count browsers
          const browser = event.deviceInfo.browser || "unknown";
          browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
        }
      }
      
      const total = analyticsData.length;
      
      const devices = Array.from(deviceCounts.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));
      
      const clients = Array.from(clientCounts.entries()).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));
      
      const browsers = Array.from(browserCounts.entries()).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));
      
      return { devices, clients, browsers };
    }
    
    const analyticsData = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .filter((q) => q.neq(q.field("deviceInfo"), undefined))
      .collect();
    
    const deviceCounts = new Map<string, number>();
    const clientCounts = new Map<string, number>();
    const browserCounts = new Map<string, number>();
    
    for (const event of analyticsData) {
      if (event.deviceInfo) {
        // Count device types
        const deviceType = event.deviceInfo.type || "unknown";
        deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
        
        // Count email clients
        const client = event.deviceInfo.client || "unknown";
        clientCounts.set(client, (clientCounts.get(client) || 0) + 1);
        
        // Count browsers
        const browser = event.deviceInfo.browser || "unknown";
        browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
      }
    }
    
    const total = analyticsData.length;
    
    const devices = Array.from(deviceCounts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }));
    
    const clients = Array.from(clientCounts.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }));
    
    const browsers = Array.from(browserCounts.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }));
    
    return {
      devices: devices.sort((a, b) => b.count - a.count),
      clients: clients.sort((a, b) => b.count - a.count),
      browsers: browsers.sort((a, b) => b.count - a.count),
    };
  },
});

export const getLocationAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    templateId: v.optional(v.string()),
  },
  returns: v.object({
    countries: v.array(v.object({
      country: v.string(),
      count: v.number(),
      percentage: v.number(),
    })),
    regions: v.array(v.object({
      region: v.string(),
      count: v.number(),
      percentage: v.number(),
    })),
    cities: v.array(v.object({
      city: v.string(),
      count: v.number(),
      percentage: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    
    if (args.templateId) {
      const analyticsData = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .filter((q) => q.and(
          q.gte(q.field("timestamp"), startDate),
          q.lte(q.field("timestamp"), endDate),
          q.neq(q.field("locationInfo"), undefined)
        ))
        .collect();
      
      const countryCounts = new Map<string, number>();
      const regionCounts = new Map<string, number>();
      const cityCounts = new Map<string, number>();
      
      for (const event of analyticsData) {
        if (event.locationInfo) {
          // Count countries
          const country = event.locationInfo.country || "unknown";
          countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
          
          // Count regions
          const region = event.locationInfo.region || "unknown";
          regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
          
          // Count cities
          const city = event.locationInfo.city || "unknown";
          cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
        }
      }
      
      const total = analyticsData.length;
      
      const countries = Array.from(countryCounts.entries()).map(([country, count]) => ({
        country,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));
      
      const regions = Array.from(regionCounts.entries()).map(([region, count]) => ({
        region,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));
      
      const cities = Array.from(cityCounts.entries()).map(([city, count]) => ({
        city,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));
      
      return { countries, regions, cities };
    }
    
    const analyticsData = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .filter((q) => q.neq(q.field("locationInfo"), undefined))
      .collect();
    
    const countryCounts = new Map<string, number>();
    const regionCounts = new Map<string, number>();
    const cityCounts = new Map<string, number>();
    
    for (const event of analyticsData) {
      if (event.locationInfo) {
        // Count countries
        const country = event.locationInfo.country || "unknown";
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
        
        // Count regions
        const region = event.locationInfo.region || "unknown";
        regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
        
        // Count cities
        const city = event.locationInfo.city || "unknown";
        cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
      }
    }
    
    const total = analyticsData.length;
    
    const countries = Array.from(countryCounts.entries()).map(([country, count]) => ({
      country,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }));
    
    const regions = Array.from(regionCounts.entries()).map(([region, count]) => ({
      region,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }));
    
    const cities = Array.from(cityCounts.entries()).map(([city, count]) => ({
      city,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }));
    
    return {
      countries: countries.sort((a, b) => b.count - a.count),
      regions: regions.sort((a, b) => b.count - a.count),
      cities: cities.sort((a, b) => b.count - a.count),
    };
  },
});

// ============================================================================
// EMAIL MONITORING AND ALERTS
// ============================================================================

export const getEmailHealthMetrics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    deliveryRate: v.number(),
    bounceRate: v.number(),
    complaintRate: v.number(),
    unsubscribeRate: v.number(),
    averageDeliveryTime: v.number(),
    queueSize: v.number(),
    processingRate: v.number(),
    errorRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const startDate = args.startDate || (Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const endDate = args.endDate || Date.now();
    
    // Get analytics data
    const analyticsData = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startDate).lte("timestamp", endDate))
      .collect();
    
    // Get queue data
    const queueData = await ctx.db
      .query("emailQueue")
      .collect();
    
    // Calculate metrics
    const sentEmails = analyticsData.filter(e => e.eventType === "sent").length;
    const deliveredEmails = analyticsData.filter(e => e.eventType === "delivered").length;
    const bouncedEmails = analyticsData.filter(e => e.eventType === "bounced").length;
    const complainedEmails = analyticsData.filter(e => e.eventType === "complained").length;
    const unsubscribedEmails = analyticsData.filter(e => e.eventType === "unsubscribed").length;
    
    const deliveryRate = sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0;
    const bounceRate = sentEmails > 0 ? (bouncedEmails / sentEmails) * 100 : 0;
    const complaintRate = sentEmails > 0 ? (complainedEmails / sentEmails) * 100 : 0;
    const unsubscribeRate = sentEmails > 0 ? (unsubscribedEmails / sentEmails) * 100 : 0;
    
    // Calculate average delivery time (simplified)
    const deliveryEvents = analyticsData.filter(e => e.eventType === "delivered");
    const averageDeliveryTime = deliveryEvents.length > 0 
      ? deliveryEvents.reduce((sum, e) => sum + (e.timestamp - (e.metadata.sentAt || e.timestamp)), 0) / deliveryEvents.length
      : 0;
    
    // Queue metrics
    const queueSize = queueData.filter(e => e.status === "pending").length;
    const processedEmails = queueData.filter(e => e.status === "sent" || e.status === "failed").length;
    const processingRate = (endDate - startDate) > 0 ? (processedEmails / ((endDate - startDate) / 1000 / 60)) : 0; // emails per minute
    
    const errorRate = queueData.length > 0 ? (queueData.filter(e => e.status === "failed").length / queueData.length) * 100 : 0;
    
    return {
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 100) / 100,
      unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
      averageDeliveryTime: Math.round(averageDeliveryTime),
      queueSize,
      processingRate: Math.round(processingRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  },
});

export const getEmailAlerts = query({
  args: {
    severity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.severity) {
      const alerts = await ctx.db
        .query("systemAlerts")
        .withIndex("by_severity", (q) => q.eq("severity", args.severity!))
        .filter((q) => q.eq(q.field("resolved"), false))
        .order("desc")
        .take(args.limit || 50);
      return alerts;
    }
    
    const alerts = await ctx.db
      .query("systemAlerts")
      .filter((q) => q.eq(q.field("resolved"), false))
      .order("desc")
      .take(args.limit || 50);
    
    return alerts;
  },
});

export const createEmailAlert = mutation({
  args: {
    type: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    service: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  returns: v.id("systemAlerts"),
  handler: async (ctx, args) => {
    const alertId = await ctx.db.insert("systemAlerts", {
      type: args.type,
      message: args.message,
      severity: args.severity,
      service: args.service,
      details: args.details,
      timestamp: Date.now(),
      resolved: false,
    });
    
    return alertId;
  },
});

export const resolveEmailAlert = mutation({
  args: { alertId: v.id("systemAlerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      resolved: true,
    });
  },
});

// ============================================================================
// EMAIL TESTING AND VALIDATION
// ============================================================================

export const runEmailTest = mutation({
  args: {
    templateId: v.string(),
    testType: v.union(
      v.literal("preview"),
      v.literal("validation"),
      v.literal("delivery"),
      v.literal("rendering")
    ),
    testData: v.record(v.string(), v.any()),
    testedBy: v.string(),
  },
  returns: v.id("emailTestResults"),
  handler: async (ctx, args) => {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    let results = {
      success: false,
      errors: [] as string[],
      warnings: [] as string[],
      renderTime: 0,
      validationScore: 0,
      deliveryStatus: "",
    };
    
    try {
      // Get template configuration
      const template = await ctx.db
        .query("emailTemplates")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
        .first();
      
      if (!template) {
        results.errors.push("Template not found");
        return await ctx.db.insert("emailTestResults", {
          testId,
          templateId: args.templateId,
          testType: args.testType,
          testData: args.testData,
          results,
          testedBy: args.testedBy,
          timestamp: Date.now(),
        });
      }
      
      // Run test based on type
      switch (args.testType) {
        case "preview":
          results = await runPreviewTest();
          break;
        case "validation":
          results = await runValidationTest(template, args.testData);
          break;
        case "delivery":
          results = await runDeliveryTest();
          break;
        case "rendering":
          results = await runRenderingTest();
          break;
      }
      
      results.renderTime = Date.now() - startTime;
      
    } catch (error) {
      results.errors.push(String(error));
    }
    
    return await ctx.db.insert("emailTestResults", {
      testId,
      templateId: args.templateId,
      testType: args.testType,
      testData: args.testData,
      results,
      testedBy: args.testedBy,
      timestamp: Date.now(),
    });
  },
});

async function runPreviewTest(): Promise<EmailTestResults> {
  // Simulate preview test
  return {
    success: true,
    errors: [],
    warnings: [],
    renderTime: 0,
    validationScore: 85,
    deliveryStatus: "preview_only",
  };
}

async function runValidationTest(template: EmailTemplate, testData: Record<string, string | number | boolean | null>): Promise<EmailTestResults> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate template structure
  if (!template.subject || template.subject.trim() === "") {
    errors.push("Subject line is required");
  }
  
  if (!template.senderEmail || !template.senderEmail.includes("@")) {
    errors.push("Valid sender email is required");
  }
  
  if (!template.styling.primaryColor || !template.styling.primaryColor.startsWith("#")) {
    warnings.push("Primary color should be a valid hex color");
  }
  
  // Validate test data
  for (const [key, value] of Object.entries(testData)) {
    if (typeof value === "string" && value.includes("{{") && value.includes("}}")) {
      warnings.push(`Unresolved template variable in ${key}: ${value}`);
    }
  }
  
  const validationScore = errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0;
  
  return {
    success: errors.length === 0,
    errors,
    warnings,
    renderTime: 0,
    validationScore,
    deliveryStatus: "validation_only",
  };
}

async function runDeliveryTest(): Promise<EmailTestResults> {
  // Simulate delivery test
  return {
    success: true,
    errors: [],
    warnings: [],
    renderTime: 0,
    validationScore: 90,
    deliveryStatus: "test_delivered",
  };
}

async function runRenderingTest(): Promise<EmailTestResults> {
  // Simulate rendering test
  return {
    success: true,
    errors: [],
    warnings: [],
    renderTime: 150,
    validationScore: 95,
    deliveryStatus: "rendered_successfully",
  };
}

// ============================================================================
// EMAIL CONFIGURATION EXPORT/IMPORT
// ============================================================================

export const exportEmailConfigurations = query({
  args: {
    configTypes: v.optional(v.array(v.union(
      v.literal("templates"),
      v.literal("automations"),
      v.literal("branding"),
      v.literal("delivery"),
      v.literal("analytics"),
      v.literal("compliance")
    ))),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const configTypes = args.configTypes || ["templates", "automations", "branding", "delivery", "analytics", "compliance"];
    const exportData: {
      version: string;
      exportedAt: number;
      configurations: Record<string, unknown>;
    } = {
      version: "1.0",
      exportedAt: Date.now(),
      configurations: {},
    };
    
    for (const configType of configTypes) {
      switch (configType) {
        case "templates":
          exportData.configurations.templates = await ctx.db.query("emailTemplates").collect();
          break;
        case "automations":
          exportData.configurations.automations = await ctx.db.query("emailAutomations").collect();
          break;
        case "branding":
          exportData.configurations.branding = await ctx.db.query("emailBranding").collect();
          break;
        case "delivery":
          exportData.configurations.delivery = await ctx.db.query("emailDelivery").collect();
          break;
        case "analytics":
          exportData.configurations.analytics = await ctx.db.query("emailAnalytics").collect();
          break;
        case "compliance":
          exportData.configurations.compliance = await ctx.db.query("emailCompliance").collect();
          break;
      }
    }
    
    return exportData;
  },
});

export const importEmailConfigurations = mutation({
  args: {
    importData: v.object({
      version: v.string(),
      exportedAt: v.number(),
      configurations: v.record(v.string(), v.any()),
    }),
    overwrite: v.optional(v.boolean()),
    changedBy: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    imported: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const { importData, overwrite = false } = args;
    // changedBy is captured but not used in the current implementation
    let imported = 0;
    const errors: string[] = [];
    
    try {
      // Import templates
      if (importData.configurations?.templates) {
        for (const template of importData.configurations.templates) {
          try {
            const existing = await ctx.db
              .query("emailTemplates")
              .withIndex("by_template_id", (q) => q.eq("templateId", template.templateId))
              .first();
            
            if (existing && !overwrite) {
              errors.push(`Template ${template.templateId} already exists`);
              continue;
            }
            
            if (existing && overwrite) {
              await ctx.db.patch(existing._id, {
                ...template,
                lastModified: Date.now(),
                version: (existing.version || 1) + 1,
              });
            } else {
              await ctx.db.insert("emailTemplates", {
                ...template,
                lastModified: Date.now(),
                version: 1,
              });
            }
            
            imported++;
          } catch (error) {
            errors.push(`Failed to import template ${template.templateId}: ${error}`);
          }
        }
      }
      
      // Import other configurations similarly...
      
    } catch (error) {
      errors.push(`Import failed: ${error}`);
    }
    
    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  },
});

// ============================================================================
// INTERNAL FUNCTIONS FOR CRON JOBS
// ============================================================================

export const cleanupOldAnalyticsData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Clean up old analytics data
    const oldAnalytics = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", thirtyDaysAgo))
      .collect();
    
    for (const analytics of oldAnalytics) {
      await ctx.db.delete(analytics._id);
    }
    
    // Clean up old test results
    const oldTestResults = await ctx.db
      .query("emailTestResults")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", thirtyDaysAgo))
      .collect();
    
    for (const testResult of oldTestResults) {
      await ctx.db.delete(testResult._id);
    }
    
    // Clean up old configuration history
    const oldHistory = await ctx.db
      .query("emailConfigHistory")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", thirtyDaysAgo))
      .collect();
    
    for (const history of oldHistory) {
      await ctx.db.delete(history._id);
    }
  },
});

// Internal query for getting dashboard stats
export const getEmailDashboardStatsInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()) },
  returns: v.object({
    totalEmails: v.number(),
    sentEmails: v.number(),
    deliveredEmails: v.number(),
    openedEmails: v.number(),
    clickedEmails: v.number(),
    bouncedEmails: v.number(),
    unsubscribedEmails: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
    unsubscribeRate: v.number(),
    deliveryRate: v.number(),
  }),
  handler: async (ctx, args) => {
    return await getEmailDashboardStatsHandler(ctx, args);
  },
});

// Internal query for getting top templates
export const getTopTemplatesInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()), limit: v.optional(v.number()) },
  returns: v.array(v.object({
    templateId: v.string(),
    templateName: v.string(),
    sent: v.number(),
    opened: v.number(),
    clicked: v.number(),
    bounced: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
  })),
  handler: async (ctx, args) => {
    return await getTopTemplatesHandler(ctx, args);
  },
});

// Internal query for getting device analytics
export const getDeviceAnalyticsInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()) },
  returns: v.array(v.object({
    deviceType: v.string(),
    count: v.number(),
    percentage: v.number(),
  })),
  handler: async (ctx, args) => {
    return await getDeviceAnalyticsHandler(ctx, args);
  },
});

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
    const stats = await ctx.runQuery(internal.emailAnalytics.getEmailDashboardStatsInternal, {
      startDate,
      endDate,
    });
    
    const topTemplates = await ctx.runQuery(internal.emailAnalytics.getTopTemplatesInternal, {
      startDate,
      endDate,
      limit: 10,
    });
    
    const deviceAnalytics = await ctx.runQuery(internal.emailAnalytics.getDeviceAnalyticsInternal, {
      startDate,
      endDate,
    });
    
    // Create daily report
    const report = {
      date: new Date(yesterday).toISOString().split('T')[0],
      stats,
      topTemplates,
      deviceAnalytics,
      generatedAt: Date.now(),
    };
    
    // Store report (you could store this in a reports table or send via email)
    console.log("Daily email report generated:", report);
  },
});

// Internal query for getting health metrics
export const getEmailHealthMetricsInternal = internalQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()) },
  returns: v.object({
    deliveryRate: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
    unsubscribeRate: v.number(),
    queueSize: v.number(),
    totalEmails: v.number(),
    sentEmails: v.number(),
    deliveredEmails: v.number(),
    openedEmails: v.number(),
    clickedEmails: v.number(),
    bouncedEmails: v.number(),
    unsubscribedEmails: v.number(),
    reputationScore: v.number(),
  }),
  handler: async (ctx, args) => {
    return await getEmailHealthMetricsHandler(ctx, args);
  },
});

// Internal mutation for creating email alerts
export const createEmailAlertInternal = internalMutation({
  args: {
    type: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    service: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  returns: v.id("systemAlerts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("systemAlerts", {
      type: args.type,
      message: args.message,
      severity: args.severity,
      service: args.service,
      details: args.details,
      timestamp: Date.now(),
      resolved: false,
    });
  },
});

export const checkEmailHealthMetrics = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    
    // Get health metrics using internal query
    const healthMetrics = await ctx.runQuery(internal.emailAnalytics.getEmailHealthMetricsInternal, {
      startDate: last24Hours,
    });
    
    // Check for alerts (only if there's actual email data)
    const alerts = [];
    
    // Only check metrics if there are actual emails sent
    if (healthMetrics.sentEmails > 0) {
      if (healthMetrics.deliveryRate < 95) {
        alerts.push({
          type: "delivery_rate_low",
          message: `Email delivery rate is ${healthMetrics.deliveryRate}%, below threshold of 95%`,
          severity: "high" as const,
        });
      }
      
      if (healthMetrics.bounceRate > 5) {
        alerts.push({
          type: "bounce_rate_high",
          message: `Email bounce rate is ${healthMetrics.bounceRate}%, above threshold of 5%`,
          severity: "medium" as const,
        });
      }
      
      if (healthMetrics.bounceRate > 10) {
        alerts.push({
          type: "bounce_rate_critical",
          message: `Email bounce rate is ${healthMetrics.bounceRate}%, above threshold of 10%`,
          severity: "critical" as const,
        });
      }
    }
    
    // Queue size check doesn't require sent emails, so check it separately
    if (healthMetrics.queueSize > 1000) {
      alerts.push({
        type: "queue_size_large",
        message: `Email queue size is ${healthMetrics.queueSize}, above threshold of 1000`,
        severity: "medium" as const,
      });
    }
    
    // Create alerts - updated
    for (const alert of alerts) {
      await ctx.runMutation(internal.emailAnalytics.createEmailAlertInternal, {
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        service: "email",
        details: JSON.stringify(healthMetrics),
      });
    }
  },
});

// Helper function to group analytics data by time period
function groupAnalyticsByPeriod(data: EmailAnalyticsData[], groupBy: string) {
  const groupedData = new Map<string, {
    period: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    openRate?: number;
    clickRate?: number;
    bounceRate?: number;
    [key: string]: string | number | undefined;
  }>();
  
  for (const event of data) {
    const date = new Date(event.timestamp);
    let period: string;
    
    switch (groupBy) {
      case "hour":
        period = date.toISOString().slice(0, 13) + ":00:00.000Z";
        break;
      case "day":
        period = date.toISOString().slice(0, 10);
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = weekStart.toISOString().slice(0, 10);
        break;
      case "month":
        period = date.toISOString().slice(0, 7);
        break;
      default:
        period = date.toISOString().slice(0, 10);
    }
    
    if (!groupedData.has(period)) {
      groupedData.set(period, {
        period,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
      });
    }
    
    const group = groupedData.get(period);
    if (group) {
      const eventType = event.eventType;
      if (eventType in group) {
        (group[eventType as keyof typeof group] as number) = ((group[eventType as keyof typeof group] as number) || 0) + 1;
      }
    }
  }
  
  // Calculate rates and ensure all fields are non-optional
  return Array.from(groupedData.values()).map(group => {
    const sent = group.sent || 0;
    return {
      period: group.period,
      sent: sent,
      delivered: group.delivered || 0,
      opened: group.opened || 0,
      clicked: group.clicked || 0,
      bounced: group.bounced || 0,
      openRate: sent > 0 ? Math.round((group.opened / sent) * 10000) / 100 : 0,
      clickRate: sent > 0 ? Math.round((group.clicked / sent) * 10000) / 100 : 0,
      bounceRate: sent > 0 ? Math.round((group.bounced / sent) * 10000) / 100 : 0,
    };
  }).sort((a, b) => a.period.localeCompare(b.period));
}

// Helper functions for internal use - exported for potential future use
export async function getEmailDashboardStatsHandler(ctx: QueryCtx, args: { startDate?: number; endDate?: number; templateId?: string }) {
  const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  
  if (args.templateId) {
    const analyticsData = await ctx.db
      .query("emailAnalyticsData")
      .withIndex("by_template_id", (q: any) => q.eq("templateId", args.templateId!))
      .filter((q: any) => q.and(
        q.gte(q.field("timestamp"), startDate),
        q.lte(q.field("timestamp"), endDate)
      ))
      .collect();
    
    // Count events by type
    const eventCounts = analyticsData.reduce((acc: Record<string, number>, event: EmailAnalyticsData) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sentEmails = eventCounts.sent || 0;
    const deliveredEmails = eventCounts.delivered || 0;
    const openedEmails = eventCounts.opened || 0;
    const clickedEmails = eventCounts.clicked || 0;
    const bouncedEmails = eventCounts.bounced || 0;
    const unsubscribedEmails = eventCounts.unsubscribed || 0;
    
    return {
      totalEmails: sentEmails,
      sentEmails,
      deliveredEmails,
      openedEmails,
      clickedEmails,
      bouncedEmails,
      unsubscribedEmails,
      openRate: sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0,
      clickRate: sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0,
      bounceRate: sentEmails > 0 ? (bouncedEmails / sentEmails) * 100 : 0,
      unsubscribeRate: sentEmails > 0 ? (unsubscribedEmails / sentEmails) * 100 : 0,
      deliveryRate: sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0,
    };
  }
  
  // Get all analytics data for the period
  const analyticsData = await ctx.db
    .query("emailAnalyticsData")
    .withIndex("by_timestamp", (q: any) => 
      q.gte("timestamp", startDate).lte("timestamp", endDate)
    )
    .collect();
  
  // Count events by type
    const eventCounts = analyticsData.reduce((acc: Record<string, number>, event: EmailAnalyticsData) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sentEmails = eventCounts.sent || 0;
  const deliveredEmails = eventCounts.delivered || 0;
  const openedEmails = eventCounts.opened || 0;
  const clickedEmails = eventCounts.clicked || 0;
  const bouncedEmails = eventCounts.bounced || 0;
  const unsubscribedEmails = eventCounts.unsubscribed || 0;
  
  return {
    totalEmails: sentEmails,
    sentEmails,
    deliveredEmails,
    openedEmails,
    clickedEmails,
    bouncedEmails,
    unsubscribedEmails,
    openRate: sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0,
    clickRate: sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0,
    bounceRate: sentEmails > 0 ? (bouncedEmails / sentEmails) * 100 : 0,
    unsubscribeRate: sentEmails > 0 ? (unsubscribedEmails / sentEmails) * 100 : 0,
    deliveryRate: sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0,
  };
}

export async function getTopTemplatesHandler(ctx: QueryCtx, args: { startDate?: number; endDate?: number; limit?: number }) {
  const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  const limit = args.limit || 10;
  
  const analyticsData = await ctx.db
    .query("emailAnalyticsData")
    .withIndex("by_timestamp", (q: any) => 
      q.gte("timestamp", startDate).lte("timestamp", endDate)
    )
    .collect();
  
  // Group by template ID and count events
  const templateStats = analyticsData.reduce((acc: Record<string, {
    templateId: string;
    templateName: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    [key: string]: string | number;
  }>, event: EmailAnalyticsData) => {
    if (!acc[event.templateId]) {
      acc[event.templateId] = {
        templateId: event.templateId,
        templateName: event.templateId, // Would need to join with templates table
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
      };
    }
    const templateStat = acc[event.templateId];
    if (templateStat) {
      const eventType = event.eventType;
      if (eventType in templateStat) {
        (templateStat[eventType as keyof typeof templateStat] as number) = ((templateStat[eventType as keyof typeof templateStat] as number) || 0) + 1;
      }
    }
    return acc;
  }, {} as Record<string, {
    templateId: string;
    templateName: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    [key: string]: string | number;
  }>);
  
  // Calculate rates and sort by sent count
  const templates = Object.values(templateStats)
    .map((template) => {
      const templateObj = template as {
        templateId: string;
        templateName: string;
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        bounced: number;
        unsubscribed: number;
        [key: string]: string | number;
      };
      return {
        templateId: templateObj.templateId,
        templateName: templateObj.templateName,
        sent: templateObj.sent,
        opened: templateObj.opened,
        clicked: templateObj.clicked,
        bounced: templateObj.bounced,
        openRate: templateObj.sent > 0 ? Math.round((templateObj.opened / templateObj.sent) * 10000) / 100 : 0,
        clickRate: templateObj.sent > 0 ? Math.round((templateObj.clicked / templateObj.sent) * 10000) / 100 : 0,
        bounceRate: templateObj.sent > 0 ? Math.round((templateObj.bounced / templateObj.sent) * 10000) / 100 : 0,
      };
    })
    .sort((a, b) => b.sent - a.sent)
    .slice(0, limit);
  
  return templates;
}

export async function getDeviceAnalyticsHandler(ctx: QueryCtx, args: { startDate?: number; endDate?: number }): Promise<DeviceAnalyticsStats[]> {
  const startDate = args.startDate || (Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  
  const analyticsData = await ctx.db
    .query("emailAnalyticsData")
    .withIndex("by_timestamp", (q: any) => 
      q.gte("timestamp", startDate).lte("timestamp", endDate)
    )
    .filter((q: any) => q.eq("eventType", "opened"))
    .collect();
  
  // Group by device type
  const deviceStats = analyticsData.reduce((acc: Record<string, number>, event: EmailAnalyticsData) => {
    const metadata = event.metadata || {};
    const deviceType = typeof metadata.deviceType === 'string' ? metadata.deviceType : "unknown";
    if (!acc[deviceType]) {
      acc[deviceType] = 0;
    }
    acc[deviceType]++;
    return acc;
  }, {} as Record<string, number>);
  
  const total = (Object.values(deviceStats) as number[]).reduce((sum: number, count: number) => sum + count, 0);
  
  return (Object.entries(deviceStats) as [string, number][]).map(([deviceType, count]: [string, number]) => ({
    deviceType,
    count: count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

async function getEmailHealthMetricsHandler(ctx: QueryCtx, args: { startDate?: number; endDate?: number }): Promise<EmailHealthMetrics> {
  const startDate = args.startDate || (Date.now() - 24 * 60 * 60 * 1000);
  const endDate = args.endDate || Date.now();
  
  const analyticsData = await ctx.db
    .query("emailAnalyticsData")
    .withIndex("by_timestamp", (q: any) => 
      q.gte("timestamp", startDate).lte("timestamp", endDate)
    )
    .collect();
  
  // Count events by type
  const eventCounts = analyticsData.reduce((acc: Record<string, number>, event: EmailAnalyticsData) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sentEmails = eventCounts.sent || 0;
  const deliveredEmails = eventCounts.delivered || 0;
  const openedEmails = eventCounts.opened || 0;
  const clickedEmails = eventCounts.clicked || 0;
  const bouncedEmails = eventCounts.bounced || 0;
  const unsubscribedEmails = eventCounts.unsubscribed || 0;
  
  // Get queue size from emailQueue table
  const queueItems = await ctx.db
    .query("emailQueue")
    .filter((q: any) => 
      q.or(
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("status"), "processing")
      )
    )
    .collect();
  const queueSize = queueItems.length;
  
  return {
    totalEmails: sentEmails,
    sentEmails,
    deliveredEmails,
    openedEmails,
    clickedEmails,
    bouncedEmails,
    unsubscribedEmails,
    openRate: sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0,
    clickRate: sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0,
    bounceRate: sentEmails > 0 ? (bouncedEmails / sentEmails) * 100 : 0,
    unsubscribeRate: sentEmails > 0 ? (unsubscribedEmails / sentEmails) * 100 : 0,
    deliveryRate: sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0,
    reputationScore: 100 - (sentEmails > 0 ? (bouncedEmails / sentEmails) * 50 : 0), // Simple reputation calculation
    queueSize,
  };
}

export async function createEmailAlertHandler(ctx: MutationCtx, args: { type: string; message: string; severity: string; service: string; details: string }) {
  await ctx.db.insert("emailAlerts", {
    type: args.type,
    message: args.message,
    severity: args.severity as "low" | "medium" | "high" | "critical",
    service: args.service,
    details: args.details,
    timestamp: Date.now(),
    resolved: false,
  });
}
