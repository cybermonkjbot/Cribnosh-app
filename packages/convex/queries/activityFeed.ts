import { query } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// Activity type definition for internal use
interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: number;
  user?: string;
  severity?: string;
  category: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export const getActivityFeed = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("all"),
      v.literal("users"),
      v.literal("orders"),
      v.literal("chefs"),
      v.literal("system"),
      v.literal("payments"),
      v.literal("new_user"),
      v.literal("new_chef"),
      v.literal("system_event"),
      v.literal("security_alert"),
      v.literal("content_created"),
      v.literal("order_created"),
      v.literal("payment_processed")
    )),
    timeRange: v.optional(v.union(
      v.literal("1h"),
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d")
    )),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    timestamp: v.number(),
    user: v.optional(v.string()),
    severity: v.optional(v.string()),
    category: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const timeRange = args.timeRange || "24h";
    const type = args.type || "all";
    
    const hours = timeRange === "1h" ? 1 : 
                  timeRange === "24h" ? 24 : 
                  timeRange === "7d" ? 168 : 720;
    
    const startTime = Date.now() - (hours * 60 * 60 * 1000);

    // Get activities from different sources
    const activities = [];

    // User activities
    if (type === "all" || type === "users" || type === "new_user") {
      const recentUsers = await ctx.db
        .query("users")
        .filter(q => q.gte(q.field("_creationTime"), startTime))
        .order("desc")
        .take(20);

      activities.push(...recentUsers.map((user: Doc<"users">) => ({
        id: `user_${user._id}`,
        type: "user_registration",
        title: "New User Registration",
        description: `${user.name || user.email} registered`,
        timestamp: user._creationTime,
        user: user._id,
        severity: "info",
        category: "users",
        details: `Email: ${user.email}`,
        metadata: { userId: user._id, userEmail: user.email },
      })));

      // User login activities
      const userLogins = await ctx.db
        .query("userSessions")
        .filter(q => q.gte(q.field("createdAt"), startTime))
        .order("desc")
        .take(10)
        ;

      for (const session of userLogins) {
        const user = await ctx.db.get(session.userId);
        if (user) {
          activities.push({
            id: `login_${session._id}`,
            type: "user_login",
            title: "User Login",
            description: `${user.name || user.email} logged in`,
            timestamp: session.createdAt,
            user: user._id,
            severity: "info",
            category: "users",
            metadata: { userId: user._id, sessionId: session._id },
          });
        }
      }
    }

    // Order activities
    if (type === "all" || type === "orders" || type === "order_created") {
      const recentOrders = await ctx.db
        .query("orders")
        .filter(q => q.gte(q.field("createdAt"), startTime))
        .order("desc")
        .take(30)
        ;

      for (const order of recentOrders) {
        const chef = await ctx.db.get(order.chef_id);
        
        const orderNumber = (order as Doc<"orders"> & { order_number?: string }).order_number;
        
        activities.push({
          id: `order_${order._id}`,
          type: "order_created",
          title: "New Order",
          description: `Order #${orderNumber || order._id.slice(-6)} placed`,
          timestamp: order.createdAt,
          user: order.customer_id,
          severity: "info",
          category: "orders",
          details: `Amount: £${order.total_amount || 0}${chef ? ` | Chef: ${chef.name || 'Unknown'}` : ''}`,
          metadata: { 
            orderId: order._id, 
            orderNumber: orderNumber,
            amount: order.total_amount,
            status: order.order_status,
            chefId: order.chef_id,
            customerId: order.customer_id,
          },
        });

        // Order status changes
        if (order.order_status === "completed") {
          activities.push({
            id: `order_completed_${order._id}`,
            type: "order_completed",
            title: "Order Completed",
            description: `Order #${orderNumber || order._id.slice(-6)} completed`,
            timestamp: order.updatedAt || order.createdAt,
            user: order.customer_id,
            severity: "success",
            category: "orders",
            details: `Amount: £${order.total_amount || 0}`,
            metadata: { orderId: order._id, amount: order.total_amount },
          });
        }
      }
    }

    // Chef activities
    if (type === "all" || type === "chefs" || type === "new_chef") {
      const recentChefs = await ctx.db
        .query("chefs")
        .filter(q => q.gte(q.field("_creationTime"), startTime))
        .order("desc")
        .take(15)
        ;

      activities.push(...recentChefs.map((chef: Doc<"chefs">) => ({
        id: `chef_${chef._id}`,
        type: "chef_application",
        title: "New Chef Application",
        description: `${chef.name || 'Unknown'} applied to be a chef`,
        timestamp: chef._creationTime,
        user: chef._id,
        severity: chef.status === "pending_verification" ? "warning" : "info",
        category: "chefs",
        details: `Status: ${chef.status}`,
        metadata: { chefId: chef._id, status: chef.status },
      })));

      // Chef status changes
      const statusChanges = await ctx.db
        .query("chefStatusChanges")
        .filter(q => q.gte(q.field("timestamp"), startTime))
        .order("desc")
        .take(10)
        ;

      for (const change of statusChanges) {
        const chef = await ctx.db.get(change.chefId);
        if (chef) {
          activities.push({
            id: `chef_status_${change._id}`,
            type: "chef_status_change",
            title: "Chef Status Changed",
            description: `${chef.name || 'Unknown'} status changed to ${change.newStatus}`,
            timestamp: change.timestamp,
            user: chef._id,
            severity: change.newStatus === "active" ? "success" : "warning",
            category: "chefs",
            details: `From ${change.oldStatus} to ${change.newStatus}`,
            metadata: { chefId: chef._id, oldStatus: change.oldStatus, newStatus: change.newStatus },
          });
        }
      }
    }

    // System activities
    if (type === "all" || type === "system" || type === "system_event" || type === "security_alert") {
      const systemAlerts = await ctx.db
        .query("systemAlerts")
        .filter(q => q.gte(q.field("timestamp"), startTime))
        .order("desc")
        .take(20)
        ;

      activities.push(...systemAlerts.map((alert: Doc<"systemAlerts">) => ({
        id: `alert_${alert._id}`,
        type: "system_alert",
        title: "System Alert",
        description: alert.message || "System alert triggered",
        timestamp: alert.timestamp || alert._creationTime,
        severity: alert.severity || "medium",
        category: "system",
        details: alert.details,
        metadata: { alertId: alert._id, service: alert.service },
      })));

      // Admin actions
      const adminActions = await ctx.db
        .query("adminLogs")
        .filter(q => q.gte(q.field("timestamp"), startTime))
        .order("desc")
        .take(15)
        ;

      activities.push(...adminActions.map((action: Doc<"adminLogs">) => ({
        id: `admin_${action._id}`,
        type: "admin_action",
        title: "Admin Action",
        description: action.action || "Admin action performed",
        timestamp: action.timestamp || action._creationTime,
        user: action.userId,
        severity: "info",
        category: "system",
        details: action.details,
        metadata: { actionId: action._id, actionType: action.action },
      })));
    }

    // Payment activities
    if (type === "all" || type === "payments" || type === "payment_processed") {
      const payments = await ctx.db
        .query("payments")
        .filter(q => q.gte(q.field("createdAt"), startTime))
        .order("desc")
        .take(20)
        ;

      activities.push(...payments.map((payment: Doc<"payments">) => ({
        id: `payment_${payment._id}`,
        type: "payment_processed",
        title: "Payment Processed",
        description: `Payment of £${payment.amount} processed`,
        timestamp: payment.createdAt,
        severity: payment.status === "succeeded" ? "success" : "warning",
        category: "payments",
        details: `Status: ${payment.status} | Method: ${payment.payment_method || 'unknown'}`,
        metadata: { paymentId: payment._id, amount: payment.amount, status: payment.status },
      })));
    }

    // Content creation activities
    if (type === "all" || type === "content_created") {
      const contentItems = await ctx.db
        .query("content")
        .filter(q => q.gte(q.field("lastModified"), startTime))
        .order("desc")
        .take(20);
      
      for (const item of contentItems) {
        // Try to find user by author name
        let userId: string | undefined;
        if (item.author) {
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("name"), item.author))
            .first();
          if (user) {
            userId = user._id;
          }
        }
        
        activities.push({
          id: `content_${item._id}`,
          type: "content_created",
          title: `New ${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Created`,
          description: `${item.title} was created`,
          timestamp: item.lastModified || item._creationTime,
          user: userId,
          severity: "info",
          category: "content",
          details: `Type: ${item.type} | Status: ${item.status}`,
          metadata: {
            contentId: item._id,
            title: item.title,
            type: item.type,
            status: item.status,
          },
        });
      }
    }

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

export const getActivityStats = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("1h"),
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d")
    )),
  },
  returns: v.object({
    totalActivities: v.number(),
    activitiesByType: v.record(v.string(), v.number()),
    activitiesByCategory: v.record(v.string(), v.number()),
    recentTrends: v.array(v.object({
      timestamp: v.number(),
      count: v.number(),
    })),
    topUsers: v.array(v.object({
      userId: v.string(),
      userName: v.string(),
      activityCount: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    const hours = timeRange === "1h" ? 1 : 
                  timeRange === "24h" ? 24 : 
                  timeRange === "7d" ? 168 : 720;
    
    const startTime = Date.now() - (hours * 60 * 60 * 1000);

    // Get all activities in the time range (simplified approach)
    const activities: Activity[] = [];

    // Calculate stats
    const activitiesByType: Record<string, number> = {};
    const activitiesByCategory: Record<string, number> = {};
    const userActivityCount: Record<string, number> = {};

    activities.forEach((activity: Activity) => {
      activitiesByType[activity.type] = (activitiesByType[activity.type] || 0) + 1;
      activitiesByCategory[activity.category] = (activitiesByCategory[activity.category] || 0) + 1;
      
      if (activity.user) {
        userActivityCount[activity.user] = (userActivityCount[activity.user] || 0) + 1;
      }
    });

    // Get top users
    const topUsersPromises = Object.entries(userActivityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(async ([userId, count]) => {
        const user = await ctx.db.get(userId as Id<"users">);
        return {
          userId,
          userName: user?.name || user?.email || "Unknown User",
          activityCount: count,
        };
      });
    
    const topUsers = await Promise.all(topUsersPromises);

    // Generate recent trends (hourly buckets)
    const trends = [];
    const bucketSize = Math.max(1, Math.floor(hours / 24)); // Hours per bucket
    const numBuckets = Math.floor(hours / bucketSize);

    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = startTime + (i * bucketSize * 60 * 60 * 1000);
      const bucketEnd = bucketStart + (bucketSize * 60 * 60 * 1000);
      
      const bucketActivities = activities.filter((activity: Activity) => 
        activity.timestamp >= bucketStart && activity.timestamp < bucketEnd
      );

      trends.push({
        timestamp: bucketStart,
        count: bucketActivities.length,
      });
    }

    return {
      totalActivities: activities.length,
      activitiesByType,
      activitiesByCategory,
      recentTrends: trends,
      topUsers,
    };
  },
});

export const getActivityFilters = query({
  args: {},
  returns: v.object({
    types: v.array(v.object({
      value: v.string(),
      label: v.string(),
      count: v.number(),
    })),
    categories: v.array(v.object({
      value: v.string(),
      label: v.string(),
      count: v.number(),
    })),
    severities: v.array(v.object({
      value: v.string(),
      label: v.string(),
      count: v.number(),
    })),
  }),
  handler: async () => {
    // Get all activities from the last 30 days (simplified approach)
    const activities: Activity[] = [];

    // Count by type
    const typeCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};

    activities.forEach((activity: Activity) => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
      categoryCounts[activity.category] = (categoryCounts[activity.category] || 0) + 1;
      if (activity.severity) {
        severityCounts[activity.severity] = (severityCounts[activity.severity] || 0) + 1;
      }
    });

    const typeLabels: Record<string, string> = {
      user_registration: "User Registration",
      user_login: "User Login",
      order_created: "Order Created",
      order_completed: "Order Completed",
      chef_application: "Chef Application",
      chef_status_change: "Chef Status Change",
      system_alert: "System Alert",
      admin_action: "Admin Action",
      payment_processed: "Payment Processed",
    };

    const categoryLabels: Record<string, string> = {
      users: "Users",
      orders: "Orders",
      chefs: "Chefs",
      system: "System",
      payments: "Payments",
    };

    const severityLabels: Record<string, string> = {
      info: "Info",
      warning: "Warning",
      error: "Error",
      success: "Success",
      critical: "Critical",
    };

    return {
      types: Object.entries(typeCounts).map(([value, count]) => ({
        value,
        label: typeLabels[value] || value,
        count,
      })),
      categories: Object.entries(categoryCounts).map(([value, count]) => ({
        value,
        label: categoryLabels[value] || value,
        count,
      })),
      severities: Object.entries(severityCounts).map(([value, count]) => ({
        value,
        label: severityLabels[value] || value,
        count,
      })),
    };
  },
});