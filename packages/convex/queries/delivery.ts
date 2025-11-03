import { v } from "convex/values";
import { query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Get delivery assignment by ID
export const getDeliveryAssignmentById = query({
  args: {
    assignmentId: v.id("deliveryAssignments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assignmentId);
  },
});

// Get delivery assignment by order ID
export const getDeliveryAssignmentByOrder = query({
  args: {
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("order_id"), args.orderId))
      .first();

    if (!order) {
      return null;
    }

    return await ctx.db
      .query("deliveryAssignments")
      .filter(q => q.eq(q.field("order_id"), order._id))
      .first();
  },
});

// Get delivery tracking history
export const getDeliveryTrackingHistory = query({
  args: {
    assignmentId: v.id("deliveryAssignments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const tracking = await ctx.db
      .query("deliveryTracking")
      .filter(q => q.eq(q.field("assignment_id"), args.assignmentId))
      .order("desc")
      .collect();

    return tracking.slice(0, limit);
  },
});

// Get available drivers
export const getAvailableDrivers = query({
  args: {
    orderLocation: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const drivers = await ctx.db
      .query("drivers")
      .filter(q => q.eq(q.field("status"), "active"))
      .filter(q => q.eq(q.field("availability"), "available"))
      .collect();

    // Sort by rating (highest first) and limit results
    const sortedDrivers = drivers
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);

    return sortedDrivers;
  },
});

// Get driver by ID
export const getDriverById = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.driverId);
  },
});

// Get drivers with filters
export const getDrivers = query({
  args: {
    status: v.optional(v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('on_hold'),
      v.literal('active'),
      v.literal('inactive'),
      v.literal('suspended')
    )),
    availability: v.optional(v.union(
      v.literal('available'),
      v.literal('busy'),
      v.literal('offline'),
      v.literal('on_delivery')
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let query = ctx.db.query("drivers");

    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    if (args.availability) {
      query = query.filter(q => q.eq(q.field("availability"), args.availability));
    }

    const drivers = await query
      .order("desc")
      .collect();

    return drivers.slice(offset, offset + limit);
  },
});

// Get delivery analytics
export const getDeliveryAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || Date.now();

    // Get all delivery assignments in date range
    const assignments = await ctx.db
      .query("deliveryAssignments")
      .filter(q => q.gte(q.field("assigned_at"), startDate))
      .filter(q => q.lte(q.field("assigned_at"), endDate))
      .collect();

    // Calculate analytics
    const totalDeliveries = assignments.length;
    const completedDeliveries = assignments.filter(a => a.status === 'delivered').length;
    const failedDeliveries = assignments.filter(a => a.status === 'failed').length;
    const inProgressDeliveries = assignments.filter(a => 
      ['assigned', 'accepted', 'picked_up', 'in_transit'].includes(a.status)
    ).length;

    // Calculate average delivery time
    const completedWithTimes = assignments.filter(a => 
      a.status === 'delivered' && a.actual_pickup_time && a.actual_delivery_time
    );
    
    const avgDeliveryTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, a) => 
          sum + (a.actual_delivery_time! - a.actual_pickup_time!), 0
        ) / completedWithTimes.length
      : 0;

    // Get driver performance
    const driverStats = new Map();
    for (const assignment of assignments) {
      const driverId = assignment.driver_id;
      if (!driverStats.has(driverId)) {
        driverStats.set(driverId, {
          totalDeliveries: 0,
          completedDeliveries: 0,
          failedDeliveries: 0,
          totalRating: 0,
          ratingCount: 0,
        });
      }
      
      const stats = driverStats.get(driverId);
      stats.totalDeliveries++;
      
      if (assignment.status === 'delivered') {
        stats.completedDeliveries++;
      } else if (assignment.status === 'failed') {
        stats.failedDeliveries++;
      }
      
      if (assignment.customer_rating) {
        stats.totalRating += assignment.customer_rating;
        stats.ratingCount++;
      }
    }

    return {
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      inProgressDeliveries,
      successRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
      avgDeliveryTimeMinutes: Math.round(avgDeliveryTime / (1000 * 60)),
      driverStats: Array.from(driverStats.entries()).map(([driverId, stats]) => ({
        driverId,
        ...stats,
        avgRating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0,
        successRate: stats.totalDeliveries > 0 ? (stats.completedDeliveries / stats.totalDeliveries) * 100 : 0,
      })),
    };
  },
});

// Get delivery zones
export const getDeliveryZones = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("deliveryZones");
    
    if (args.isActive !== undefined) {
      query = query.filter(q => q.eq(q.field("is_active"), args.isActive));
    }

    return await query.collect();
  },
}); 