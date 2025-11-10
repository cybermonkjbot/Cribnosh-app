import { query } from "../_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "../../../apps/web/types/convex-contexts";

export const getQuickActions = query({
  args: {},
  returns: v.array(v.object({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.string(),
    bgColor: v.string(),
    action: v.string(),
    badge: v.optional(v.string()),
    disabled: v.boolean(),
    requiresPermission: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    // Get current system status to determine which actions are available
    const pendingUsers = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("status"), "inactive"))
      .collect();

    const pendingChefs = await ctx.db
      .query("chefs")
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();

    const pendingOrders = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("order_status"), "pending"))
      .collect();

    const systemAlerts = await ctx.db
      .query("systemAlerts")
      .filter(q => q.and(
        q.eq(q.field("resolved"), false),
        q.eq(q.field("severity"), "critical")
      ))
      .collect();

    return [
      {
        id: 'add-user',
        title: 'Add User',
        description: 'Create new user account',
        icon: 'Users',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        action: 'navigate',
        badge: pendingUsers.length > 0 ? pendingUsers.length.toString() : undefined,
        disabled: false,
        requiresPermission: 'user_management',
      },
      {
        id: 'manage-chefs',
        title: 'Manage Chefs',
        description: 'View and manage chef accounts',
        icon: 'ChefHat',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        action: 'navigate',
        badge: pendingChefs.length > 0 ? pendingChefs.length.toString() : undefined,
        disabled: false,
        requiresPermission: 'chef_management',
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        description: 'Configure system preferences',
        icon: 'Settings',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        action: 'navigate',
        disabled: false,
        requiresPermission: 'system_settings',
      },
      {
        id: 'security-audit',
        title: 'Security Audit',
        description: 'Run security checks',
        icon: 'Shield',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        action: 'execute',
        badge: systemAlerts.length > 0 ? 'Critical' : undefined,
        disabled: false,
        requiresPermission: 'security',
      },
      {
        id: 'analytics-report',
        title: 'Analytics Report',
        description: 'Generate performance report',
        icon: 'BarChart3',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        action: 'execute',
        disabled: false,
        requiresPermission: 'analytics',
      },
      {
        id: 'send-notification',
        title: 'Send Notification',
        description: 'Send system-wide notification',
        icon: 'Bell',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        action: 'modal',
        disabled: false,
        requiresPermission: 'notifications',
      },
      {
        id: 'backup-data',
        title: 'Backup Data',
        description: 'Create system backup',
        icon: 'Database',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        action: 'execute',
        disabled: false,
        requiresPermission: 'backup',
      },
      {
        id: 'view-logs',
        title: 'View Logs',
        description: 'Access system logs',
        icon: 'FileText',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        action: 'navigate',
        disabled: false,
        requiresPermission: 'logs',
      },
    ];
  },
});

export const getAdminDashboardStats = query({
  args: {},
  returns: v.object({
    totalUsers: v.number(),
    activeUsers: v.number(),
    pendingUsers: v.number(),
    totalChefs: v.number(),
    activeChefs: v.number(),
    pendingChefs: v.number(),
    totalOrders: v.number(),
    pendingOrders: v.number(),
    completedOrders: v.number(),
    totalRevenue: v.number(),
    systemAlerts: v.number(),
    criticalAlerts: v.number(),
    lastUpdated: v.number(),
  }),
  handler: async (ctx) => {
    const [
      users,
      chefs,
      orders,
      systemAlerts,
      criticalAlerts
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("chefs").collect(),
      ctx.db.query("orders").collect(),
      ctx.db.query("systemAlerts")
        .filter(q => q.eq(q.field("resolved"), false))
        .collect(),
      ctx.db.query("systemAlerts")
        .filter(q => q.and(
          q.eq(q.field("resolved"), false),
          q.eq(q.field("severity"), "critical")
        ))
        .collect(),
    ]);

    const activeUsers = users.filter(user => 
      user.lastLogin && Date.now() - user.lastLogin < 7 * 24 * 60 * 60 * 1000
    ).length;

    const pendingUsers = users.filter(user => user.status === "inactive").length;
    const activeChefs = chefs.filter(chef => chef.status === "active").length;
    const pendingChefs = chefs.filter(chef => chef.status === "inactive").length;
    
    const pendingOrders = orders.filter(order => order.order_status === "pending").length;
    const completedOrders = orders.filter(order => order.order_status === "completed").length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      totalUsers: users.length,
      activeUsers,
      pendingUsers,
      totalChefs: chefs.length,
      activeChefs,
      pendingChefs,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      totalRevenue,
      systemAlerts: systemAlerts.length,
      criticalAlerts: criticalAlerts.length,
      lastUpdated: Date.now(),
    };
  },
});

export const getRecentAdminActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    description: v.string(),
    timestamp: v.number(),
    user: v.optional(v.string()),
    severity: v.optional(v.string()),
    details: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Get recent admin logs
    const adminLogs = await ctx.db
      .query("adminLogs")
      .order("desc")
      .take(limit)
        ;

    // Get recent system alerts
    const systemAlerts = await ctx.db
      .query("systemAlerts")
      .filter(q => q.gte(q.field("timestamp"), Date.now() - (24 * 60 * 60 * 1000)))
      .order("desc")
      .take(10)
        ;

    // Get recent user registrations
    const recentUsers = await ctx.db
      .query("users")
      .filter(q => q.gte(q.field("_creationTime"), Date.now() - (24 * 60 * 60 * 1000)))
      .order("desc")
      .take(5)
        ;

    // Get recent orders
    const recentOrders = await ctx.db
      .query("orders")
      .filter(q => q.gte(q.field("createdAt"), Date.now() - (24 * 60 * 60 * 1000)))
      .order("desc")
      .take(5)
        ;

    // Combine and format activities
    const activities = [
      ...adminLogs.map((log: any) => ({
        id: log._id,
        type: 'admin_action',
        description: log.action || 'Admin action performed',
        timestamp: log.timestamp || log._creationTime,
        user: log.userId || 'Unknown',
        severity: 'info',
        details: log.details,
      })),
      ...systemAlerts.map((alert: any) => ({
        id: alert._id,
        type: 'system_alert',
        description: alert.message || 'System alert',
        timestamp: alert.timestamp || alert._creationTime,
        severity: alert.severity || 'medium',
        details: alert.details,
      })),
      ...recentUsers.map((user: any) => ({
        id: user._id,
        type: 'user_registration',
        description: `New user registered: ${user.name || user.email}`,
        timestamp: user._creationTime,
        severity: 'info',
      })),
      ...recentOrders.map((order: any) => ({
        id: order._id,
        type: 'new_order',
        description: `New order placed: #${order.order_number || order._id.slice(-6)}`,
        timestamp: order.createdAt,
        severity: 'info',
        details: `Amount: £${order.total_amount || 0}`,
      })),
    ];

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

export const getSystemStatus = query({
  args: {},
  returns: v.object({
    overall: v.string(),
    services: v.array(v.object({
      name: v.string(),
      status: v.string(),
      responseTime: v.number(),
      uptime: v.number(),
    })),
    metrics: v.object({
      cpuUsage: v.number(),
      memoryUsage: v.number(),
      diskUsage: v.number(),
      networkLatency: v.number(),
    }),
    lastChecked: v.number(),
  }),
  handler: async (ctx) => {
    // Get system health data
    const healthRecords = await ctx.db.query("systemHealth").collect();
    
    // Calculate overall status
    const criticalAlerts = await ctx.db
      .query("systemAlerts")
      .filter(q => q.and(
        q.eq(q.field("resolved"), false),
        q.eq(q.field("severity"), "critical")
      ))
      .collect();

    const overall = criticalAlerts.length > 0 ? "critical" : "operational";

    // Get real service status from monitoring data
    const services = await getRealServiceStatus(ctx);
    
    // Get real system metrics from monitoring data
    const metrics = await getRealSystemMetrics(ctx);

    return {
      overall,
      services,
      metrics,
      lastChecked: Date.now(),
    };
  },
});

// Helper function to get real service status from monitoring data
interface ServiceStatus {
  name: string;
  status: string;
  responseTime: number;
  uptime: number;
}

async function getRealServiceStatus(ctx: QueryCtx): Promise<ServiceStatus[]> {
  try {
    // Get recent system health data
    const healthDataArray = await ctx.db
      .query("systemHealth")
      .order("desc")
      .take(10);

    // Group by service and get latest status
    type HealthData = { service: string; status: string; lastChecked: number; responseTime?: number; uptime?: number; [key: string]: unknown };
    const serviceMap = new Map<string, HealthData>();
    (healthDataArray as HealthData[]).forEach((health: HealthData) => {
      const existing = serviceMap.get(health.service);
      if (!existing || health.lastChecked > existing.lastChecked) {
        serviceMap.set(health.service, health);
      }
    });

    // Convert to array format - return only real data from database
    const services = Array.from(serviceMap.values()).map(health => ({
      name: health.service,
      status: health.status === 'healthy' ? 'healthy' : 
              health.status === 'degraded' ? 'warning' : 
              'critical',
      responseTime: health.responseTime || 0,
      uptime: health.uptime || 0
    } as ServiceStatus));

    // Return only real services from database - no fallback data
    return services;
  } catch (error) {
    console.error('Failed to get real service status:', error);
    // Return empty array if no data - no fallback
    return [];
  }
}

// Helper function to get real system metrics from monitoring data
interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

async function getRealSystemMetrics(ctx: QueryCtx): Promise<SystemMetrics> {
  try {
    // Get recent system metrics
    const metricsData = await ctx.db
      .query("systemMetrics")
      .order("desc")
      .take(20);

    // Calculate averages for different metric types
    type MetricData = { type: string; value: number; [key: string]: unknown };
    const metricsByType = new Map<string, number[]>();
    (metricsData as MetricData[]).forEach((metric: MetricData) => {
      if (!metricsByType.has(metric.type)) {
        metricsByType.set(metric.type, []);
      }
      const metricArray = metricsByType.get(metric.type);
      if (metricArray) {
        metricArray.push(metric.value);
      }
    });

    // Calculate averages
    const metrics: SystemMetrics = {
      cpuUsage: calculateAverage(metricsByType.get('cpu_usage') || [0]),
      memoryUsage: calculateAverage(metricsByType.get('memory_usage') || [0]),
      diskUsage: calculateAverage(metricsByType.get('disk_usage') || [0]),
      networkLatency: calculateAverage(metricsByType.get('network_latency') || [0])
    };

    return metrics;
  } catch (error) {
    console.error('Failed to get real system metrics:', error);
    // Return zero values if no data - no fallback
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkLatency: 0
    } as SystemMetrics;
  }
}

// Helper function to calculate average
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
