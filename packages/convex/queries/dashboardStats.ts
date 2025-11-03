import { query } from "../_generated/server";
import { v } from "convex/values";

export const getDashboardFooterStats = query({
  args: {},
  returns: v.object({
    systemStatus: v.object({
      status: v.string(),
      uptime: v.number(),
      responseTime: v.number(),
      lastChecked: v.number(),
    }),
    activeUsers: v.object({
      count: v.number(),
      trend: v.string(),
      change: v.number(),
    }),
    liveStreams: v.object({
      count: v.number(),
      activeChefs: v.number(),
      totalViewers: v.number(),
    }),
    pendingOrders: v.object({
      count: v.number(),
      urgent: v.number(),
      averageWaitTime: v.number(),
    }),
    revenue: v.object({
      today: v.number(),
      thisWeek: v.number(),
      thisMonth: v.number(),
      trend: v.string(),
    }),
    performance: v.object({
      cpuUsage: v.number(),
      memoryUsage: v.number(),
      diskUsage: v.number(),
      networkLatency: v.number(),
    }),
  }),
  handler: async (ctx) => {
    // Get system health
    const systemHealth = await ctx.db
      .query("systemHealth")
      .filter(q => q.eq(q.field("service"), "main"))
      .first();

    // Get active users (users with sessions in last 15 minutes)
    const activeSessions = await ctx.db
      .query("sessions")
      .filter(q => q.gt(q.field("expiresAt"), Date.now()))
      .collect();

    const activeUsers = new Set(activeSessions.map(session => session.userId)).size;

    // Get live streams
    const liveStreams = await ctx.db
      .query("liveSessions")
      .filter(q => q.eq(q.field("status"), "live"))
      .collect();

    const activeChefs = new Set(liveStreams.map(stream => stream.chef_id)).size;
    const totalViewers = liveStreams.reduce((sum, stream) => sum + (stream.viewerCount || 0), 0);

    // Get pending orders
    const pendingOrders = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("order_status"), "pending"))
      .collect();

    const urgentOrders = pendingOrders.filter(order => {
      const waitTime = Date.now() - order.createdAt;
      return waitTime > 30 * 60 * 1000; // More than 30 minutes
    }).length;

    const averageWaitTime = pendingOrders.length > 0 
      ? pendingOrders.reduce((sum, order) => sum + (Date.now() - order.createdAt), 0) / pendingOrders.length / (1000 * 60) // Convert to minutes
      : 0;

    // Get revenue data
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - (7 * 24 * 60 * 60 * 1000);
    const monthStart = now - (30 * 24 * 60 * 60 * 1000);

    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      ctx.db.query("orders")
        .filter(q => q.gte(q.field("createdAt"), todayStart))
        .collect(),
      ctx.db.query("orders")
        .filter(q => q.gte(q.field("createdAt"), weekStart))
        .collect(),
      ctx.db.query("orders")
        .filter(q => q.gte(q.field("createdAt"), monthStart))
        .collect(),
    ]);

    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const weekRevenue = weekOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    // Calculate revenue trend
    const previousWeekRevenue = await ctx.db
      .query("orders")
      .filter(q => q.and(
        q.gte(q.field("createdAt"), now - (14 * 24 * 60 * 60 * 1000)),
        q.lt(q.field("createdAt"), weekStart)
      ))
      .collect()
      .then(orders => orders.reduce((sum, order) => sum + (order.total_amount || 0), 0));

    const revenueTrend = previousWeekRevenue > 0 
      ? ((weekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 
      : 0;

    // Get performance metrics (mock data for now)
    const performance = {
      cpuUsage: 45 + Math.random() * 20,
      memoryUsage: 60 + Math.random() * 15,
      diskUsage: 75 + Math.random() * 10,
      networkLatency: 50 + Math.random() * 30,
    };

    return {
      systemStatus: {
        status: systemHealth?.status || "operational",
        uptime: 99.9,
        responseTime: systemHealth?.responseTime || 120,
        lastChecked: Date.now(),
      },
      activeUsers: {
        count: activeUsers,
        trend: "up",
        change: 5.2, // Mock change percentage
      },
      liveStreams: {
        count: liveStreams.length,
        activeChefs,
        totalViewers,
      },
      pendingOrders: {
        count: pendingOrders.length,
        urgent: urgentOrders,
        averageWaitTime: Math.round(averageWaitTime),
      },
      revenue: {
        today: todayRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
        trend: revenueTrend >= 0 ? "up" : "down",
      },
      performance,
    };
  },
});

export const getRealTimeMetrics = query({
  args: {},
  returns: v.object({
    activeUsers: v.number(),
    activeSessions: v.number(),
    pendingOrders: v.number(),
    liveStreams: v.number(),
    systemHealth: v.object({
      status: v.string(),
      responseTime: v.number(),
    }),
    alerts: v.array(v.object({
      id: v.string(),
      type: v.string(),
      message: v.string(),
      severity: v.string(),
      timestamp: v.number(),
    })),
  }),
  handler: async (ctx) => {
    // Get active users (users with sessions in last 15 minutes)
    const activeSessions = await ctx.db
      .query("sessions")
      .filter(q => q.gt(q.field("expiresAt"), Date.now()))
      .collect();

    const activeUsers = new Set(activeSessions.map(session => session.userId)).size;

    // Get pending orders
    const pendingOrders = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("order_status"), "pending"))
      .collect();

    // Get active live streams
    const liveStreams = await ctx.db
      .query("liveSessions")
      .filter(q => q.eq(q.field("status"), "live"))
      .collect();

    // Get system health
    const systemHealth = await ctx.db
      .query("systemHealth")
      .filter(q => q.eq(q.field("service"), "main"))
      .first();

    // Get recent alerts
    const alerts = await ctx.db
      .query("systemAlerts")
      .filter(q => q.and(
        q.eq(q.field("resolved"), false),
        q.gte(q.field("timestamp"), Date.now() - (24 * 60 * 60 * 1000))
      ))
      .order("desc")
      .take(5);

    return {
      activeUsers,
      activeSessions: activeSessions.length,
      pendingOrders: pendingOrders.length,
      liveStreams: liveStreams.length,
      systemHealth: {
        status: systemHealth?.status || "operational",
        responseTime: systemHealth?.responseTime || 0,
      },
      alerts: alerts.map((alert: any) => ({
        id: alert._id,
        type: alert.type || "system",
        message: alert.message || "System alert",
        severity: alert.severity || "medium",
        timestamp: alert.timestamp || alert._creationTime,
      })),
    };
  },
});

export const getDashboardSummary = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("1h"),
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d")
    )),
  },
  returns: v.object({
    overview: v.object({
      totalUsers: v.number(),
      totalOrders: v.number(),
      totalRevenue: v.number(),
      activeChefs: v.number(),
    }),
    trends: v.object({
      userGrowth: v.number(),
      orderGrowth: v.number(),
      revenueGrowth: v.number(),
      chefGrowth: v.number(),
    }),
    performance: v.object({
      orderCompletionRate: v.number(),
      averageOrderValue: v.number(),
      customerSatisfaction: v.number(),
      systemUptime: v.number(),
    }),
    alerts: v.object({
      critical: v.number(),
      warning: v.number(),
      info: v.number(),
      total: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    const hours = timeRange === "1h" ? 1 : 
                  timeRange === "24h" ? 24 : 
                  timeRange === "7d" ? 168 : 720;
    
    const startTime = Date.now() - (hours * 60 * 60 * 1000);
    const previousStartTime = startTime - (hours * 60 * 60 * 1000);

    // Get current period data
    const [currentUsers, currentOrders, currentChefs] = await Promise.all([
      ctx.db.query("users")
        .filter(q => q.gte(q.field("_creationTime"), startTime))
        .collect(),
      ctx.db.query("orders")
        .filter(q => q.gte(q.field("createdAt"), startTime))
        .collect(),
      ctx.db.query("chefs")
        .filter(q => q.and(
          q.gte(q.field("_creationTime"), startTime),
          q.eq(q.field("status"), "active")
        ))
        .collect(),
    ]);

    // Get previous period data for growth calculation
    const [previousUsers, previousOrders, previousChefs] = await Promise.all([
      ctx.db.query("users")
        .filter(q => q.and(
          q.gte(q.field("_creationTime"), previousStartTime),
          q.lt(q.field("_creationTime"), startTime)
        ))
        .collect(),
      ctx.db.query("orders")
        .filter(q => q.and(
          q.gte(q.field("createdAt"), previousStartTime),
          q.lt(q.field("createdAt"), startTime)
        ))
        .collect(),
      ctx.db.query("chefs")
        .filter(q => q.and(
          q.gte(q.field("_creationTime"), previousStartTime),
          q.lt(q.field("_creationTime"), startTime),
          q.eq(q.field("status"), "active")
        ))
        .collect(),
    ]);

    // Calculate overview metrics
    // Get total users count (all users, not just in time range)
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const totalOrders = currentOrders.length;
    const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const activeChefs = currentChefs.length;

    // Calculate growth trends
    const userGrowth = previousUsers.length > 0 
      ? ((totalUsers - previousUsers.length) / previousUsers.length) * 100 
      : 0;
    const orderGrowth = previousOrders.length > 0 
      ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 
      : 0;
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const chefGrowth = previousChefs.length > 0 
      ? ((activeChefs - previousChefs.length) / previousChefs.length) * 100 
      : 0;

    // Calculate performance metrics
    const completedOrders = currentOrders.filter(order => order.order_status === "completed").length;
    const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get customer satisfaction from reviews
    const reviews = await ctx.db
      .query("reviews")
      .filter(q => q.gte(q.field("createdAt"), startTime))
      .collect();

    const customerSatisfaction = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
      : 0;

    // Get system uptime (mock for now)
    const systemUptime = 99.9;

    // Get alert counts
    const [criticalAlerts, warningAlerts, infoAlerts] = await Promise.all([
      ctx.db.query("systemAlerts")
        .filter(q => q.and(
          q.eq(q.field("resolved"), false),
          q.eq(q.field("severity"), "critical")
        ))
        .collect(),
      ctx.db.query("systemAlerts")
        .filter(q => q.and(
          q.eq(q.field("resolved"), false),
          q.eq(q.field("severity"), "warning")
        ))
        .collect(),
      ctx.db.query("systemAlerts")
        .filter(q => q.and(
          q.eq(q.field("resolved"), false),
          q.eq(q.field("severity"), "info")
        ))
        .collect(),
    ]);

    return {
      overview: {
        totalUsers,
        totalOrders,
        totalRevenue,
        activeChefs,
      },
      trends: {
        userGrowth,
        orderGrowth,
        revenueGrowth,
        chefGrowth,
      },
      performance: {
        orderCompletionRate,
        averageOrderValue,
        customerSatisfaction,
        systemUptime,
      },
      alerts: {
        critical: criticalAlerts.length,
        warning: warningAlerts.length,
        info: infoAlerts.length,
        total: criticalAlerts.length + warningAlerts.length + infoAlerts.length,
      },
    };
  },
});
