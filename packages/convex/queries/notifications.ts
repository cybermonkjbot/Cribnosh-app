// @ts-nocheck
import { query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    roles: v.array(v.string()),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    timestamp: v.number(),
    read: v.boolean(),
    priority: v.string(),
    category: v.string(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Get user-specific notifications
    let notificationsQuery = ctx.db
      .query("notifications")
      .filter(q => q.eq(q.field("userId"), args.userId));

    if (args.unreadOnly) {
      notificationsQuery = notificationsQuery.filter(q => q.eq(q.field("read"), false));
    }

    const userNotifications = await notificationsQuery
      .order("desc")
      .take(limit);

    // Get system-wide notifications based on user roles
    const systemNotifications = await ctx.db
      .query("systemNotifications")
      .order("desc")
      .take(20);

    // Get admin notifications if user has admin role
    let adminNotifications: any[] = [];
    if (args.roles.includes("admin") || args.roles.includes("super_admin")) {
      adminNotifications = await ctx.db
        .query("adminNotifications")
        .order("desc")
        .take(30);
    }

    // Combine and format all notifications
    const allNotifications = [
      ...userNotifications.map((notif: any) => ({
        id: notif._id,
        type: notif.type || "info",
        title: notif.title || "Notification",
        message: notif.message || "",
        timestamp: notif.timestamp || notif._creationTime,
        read: notif.read || false,
        priority: notif.priority || "medium",
        category: notif.category || "general",
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
      })),
      ...systemNotifications.map((notif: any) => ({
        id: `system_${notif._id}`,
        type: notif.type || "system",
        title: notif.title || "System Notification",
        message: notif.message || "",
        timestamp: notif.timestamp || notif._creationTime,
        read: false, // System notifications are always unread initially
        priority: notif.priority || "medium",
        category: notif.category || "system",
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
      })),
      ...adminNotifications.map((notif: any) => ({
        id: `admin_${notif._id}`,
        type: notif.type || "admin",
        title: notif.title || "Admin Notification",
        message: notif.message || "",
        timestamp: notif.timestamp || notif._creationTime,
        read: false,
        priority: notif.priority || "high",
        category: notif.category || "admin",
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
      })),
    ];

    // Sort by timestamp and return limited results
    return allNotifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

export const getNotificationStats = query({
  args: {
    userId: v.id("users"),
    roles: v.array(v.string()),
  },
  returns: v.object({
    total: v.number(),
    unread: v.number(),
    byType: v.record(v.string(), v.number()),
    byPriority: v.record(v.string(), v.number()),
    byCategory: v.record(v.string(), v.number()),
    recentCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all notifications for the user (inlined logic)
    const limit = 1000;
    
    // Get user-specific notifications
    let notificationsQuery = ctx.db
      .query("notifications")
      .filter(q => q.eq(q.field("userId"), args.userId));

    const userNotifications = await notificationsQuery
      .order("desc")
      .take(limit);

    // Get system-wide notifications based on user roles
    const systemNotifications = await ctx.db
      .query("systemNotifications")
      .order("desc")
      .take(20);

    // Get admin notifications if user has admin role
    let adminNotifications: any[] = [];
    if (args.roles.includes("admin") || args.roles.includes("super_admin")) {
      adminNotifications = await ctx.db
        .query("adminNotifications")
        .order("desc")
        .take(30);
    }

    // Combine and format all notifications
    const notifications = [
      ...userNotifications.map((notif: any) => ({
        id: notif._id,
        type: notif.type || "info",
        title: notif.title || "Notification",
        message: notif.message || "",
        timestamp: notif.timestamp || notif._creationTime,
        read: notif.read || false,
        priority: notif.priority || "medium",
        category: notif.category || "general",
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
      })),
      ...systemNotifications.map((notif: any) => ({
        id: `system_${notif._id}`,
        type: notif.type || "system",
        title: notif.title || "System Notification",
        message: notif.message || "",
        timestamp: notif.timestamp || notif._creationTime,
        read: false, // System notifications are always unread initially
        priority: notif.priority || "medium",
        category: notif.category || "system",
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
      })),
      ...adminNotifications.map((notif: any) => ({
        id: `admin_${notif._id}`,
        type: notif.type || "admin",
        title: notif.title || "Admin Notification",
        message: notif.message || "",
        timestamp: notif.timestamp || notif._creationTime,
        read: false,
        priority: notif.priority || "high",
        category: notif.category || "admin",
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
      })),
    ];

    // Sort by timestamp and return limited results
    const allNotifications = notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Calculate stats
    const unread = allNotifications.filter((n: any) => !n.read).length;
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    allNotifications.forEach((notif: any) => {
      byType[notif.type] = (byType[notif.type] || 0) + 1;
      byPriority[notif.priority] = (byPriority[notif.priority] || 0) + 1;
      byCategory[notif.category] = (byCategory[notif.category] || 0) + 1;
    });

    // Count recent notifications (last 24 hours)
    const recentCount = allNotifications.filter((notif: any) => 
      notif.timestamp > Date.now() - (24 * 60 * 60 * 1000)
    ).length;

    return {
      total: allNotifications.length,
      unread,
      byType,
      byPriority,
      byCategory,
      recentCount,
    };
  },
});

export const getSystemNotifications = query({
  args: {
    limit: v.optional(v.number()),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    timestamp: v.number(),
    priority: v.string(),
    category: v.string(),
    targetRoles: v.array(v.string()),
    active: v.boolean(),
    expiresAt: v.optional(v.number()),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let query = ctx.db.query("systemNotifications");
    
    if (args.activeOnly) {
      query = query.filter(q => q.eq(q.field("active"), true));
    }

    const notifications = await query
      .order("desc")
      .take(limit);

    return notifications.map((notif: any) => ({
      id: notif._id,
      type: notif.type || "system",
      title: notif.title || "System Notification",
      message: notif.message || "",
      timestamp: notif.timestamp || notif._creationTime,
      priority: notif.priority || "medium",
      category: notif.category || "system",
      targetRoles: notif.targetRoles || ["all"],
      active: notif.active || false,
      expiresAt: notif.expiresAt,
      actionUrl: notif.actionUrl,
      metadata: notif.metadata,
    }));
  },
});

export const getAdminNotifications = query({
  args: {
    limit: v.optional(v.number()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    timestamp: v.number(),
    priority: v.string(),
    category: v.string(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    resolved: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let query = ctx.db.query("adminNotifications");
    
    if (args.priority) {
      query = query.filter(q => q.eq(q.field("priority"), args.priority));
    }

    const notifications = await query
      .order("desc")
      .take(limit);

    return notifications.map((notif: any) => ({
      id: notif._id,
      type: notif.type || "admin",
      title: notif.title || "Admin Notification",
      message: notif.message || "",
      timestamp: notif.timestamp || notif._creationTime,
      priority: notif.priority || "medium",
      category: notif.category || "admin",
      actionUrl: notif.actionUrl,
      metadata: notif.metadata,
      resolved: notif.resolved || false,
    }));
  },
});

export const getNotificationSettings = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    smsNotifications: v.boolean(),
    notificationTypes: v.record(v.string(), v.boolean()),
    quietHours: v.optional(v.object({
      enabled: v.boolean(),
      start: v.string(),
      end: v.string(),
    })),
    frequency: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get user's notification settings
    const settings = await ctx.db
      .query("notificationSettings")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (settings) {
      return {
        emailNotifications: settings.emailNotifications || true,
        pushNotifications: settings.pushNotifications || true,
        smsNotifications: settings.smsNotifications || false,
        notificationTypes: settings.notificationTypes || {
          orders: true,
          payments: true,
          system: true,
          marketing: false,
        },
        quietHours: settings.quietHours,
        frequency: settings.frequency || "immediate",
      };
    }

    // Return default settings if none exist
    return {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationTypes: {
        orders: true,
        payments: true,
        system: true,
        marketing: false,
      },
      frequency: "immediate",
    };
  },
});

export const getAll = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("notifications"),
    _creationTime: v.number(),
    userId: v.optional(v.id("users")),
    roles: v.optional(v.array(v.string())),
    read: v.optional(v.boolean()),
    global: v.optional(v.boolean()),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    timestamp: v.optional(v.number()),
    priority: v.optional(v.string()),
    category: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .order("desc")
      .collect();

    return notifications.map((notif: any) => ({
      _id: notif._id,
      _creationTime: notif._creationTime,
      userId: notif.userId,
      roles: notif.roles,
      read: notif.read,
      global: notif.global,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp,
      priority: notif.priority,
      category: notif.category,
      actionUrl: notif.actionUrl,
      metadata: notif.metadata,
      createdAt: notif.createdAt,
    }));
  },
});

export const getNotificationHistory = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    timestamp: v.number(),
    read: v.boolean(),
    readAt: v.optional(v.number()),
    priority: v.string(),
    category: v.string(),
    actionUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const startDate = args.startDate || Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || Date.now();

    let query = ctx.db
      .query("notifications")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.gte(q.field("timestamp"), startDate))
      .filter(q => q.lte(q.field("timestamp"), endDate));

    const notifications = await query
      .order("desc")
      .take(limit);

    return notifications.map((notif: any) => ({
      id: notif._id,
      type: notif.type || "info",
      title: notif.title || "Notification",
      message: notif.message || "",
      timestamp: notif.timestamp || notif._creationTime,
      read: notif.read || false,
      readAt: notif.readAt,
      priority: notif.priority || "medium",
      category: notif.category || "general",
      actionUrl: notif.actionUrl,
    }));
  },
});