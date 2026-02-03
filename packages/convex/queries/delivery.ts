// @ts-nocheck
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

// Validators
const locationValidator = v.object({
  latitude: v.number(),
  longitude: v.number(),
});

const driverStatusValidator = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('on_hold'),
  v.literal('active'),
  v.literal('inactive'),
  v.literal('suspended')
);

const driverAvailabilityValidator = v.union(
  v.literal('available'),
  v.literal('busy'),
  v.literal('offline'),
  v.literal('on_delivery')
);

// Get delivery assignment by ID
export const getDeliveryAssignmentById = query({
  args: {
    assignmentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assignmentId as any);
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
      .filter((q: any) => q.eq(q.field("order_id"), args.orderId))
      .first();

    if (!order) {
      return null;
    }

    return await ctx.db
      .query("deliveryAssignments")
      .filter((q: any) => q.eq(q.field("order_id"), order._id))
      .first();
  },
});

// Get active assignment for a driver
export const getDriverActiveAssignment = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    // Find any assignment for this driver that is NOT delivered/failed/cancelled
    // We look for 'assigned', 'accepted', 'picked_up', 'in_transit'
    const assignments = await ctx.db
      .query("deliveryAssignments")
      .withIndex("by_driver", (q) => q.eq("driver_id", args.driverId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "assigned"),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("status"), "picked_up"),
          q.eq(q.field("status"), "in_transit")
        )
      )
      .first();

    return assignments;
  },
});

// Get delivery tracking history
export const getDeliveryTrackingHistory = query({
  args: {
    assignmentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const tracking = await ctx.db
      .query("deliveryTracking")
      .filter((q: any) => q.eq(q.field("assignment_id"), args.assignmentId))
      .order("desc")
      .collect();

    return tracking.slice(0, limit);
  },
});

// Get available drivers
export const getAvailableDrivers = query({
  args: {
    orderLocation: locationValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const drivers = await ctx.db
      .query("drivers")
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .filter((q: any) => q.eq(q.field("availability"), "available"))
      .collect();

    // Sort by rating (highest first) and limit results
    const sortedDrivers = drivers
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, limit);

    return sortedDrivers;
  },
});

// Get driver by ID
export const getDriverById = query({
  args: {
    driverId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.driverId as any);
  },
});

// Get drivers with filters
export const getDrivers = query({
  args: {
    status: v.optional(driverStatusValidator),
    availability: v.optional(driverAvailabilityValidator),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let query = ctx.db.query("drivers");

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    if (args.availability) {
      query = query.filter((q: any) => q.eq(q.field("availability"), args.availability));
    }

    const drivers = await query
      .order("desc")
      .collect();

    return drivers.slice(offset, offset + limit);
  },
});

interface DriverStats {
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  totalRating: number;
  ratingCount: number;
}

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
      .filter((q: any) => q.gte(q.field("assigned_at"), startDate))
      .filter((q: any) => q.lte(q.field("assigned_at"), endDate))
      .collect();

    // Calculate analytics
    const totalDeliveries = assignments.length;
    const completedDeliveries = assignments.filter((a: Doc<"deliveryAssignments">) => a.status === 'delivered').length;
    const failedDeliveries = assignments.filter((a: Doc<"deliveryAssignments">) => a.status === 'failed').length;
    const inProgressDeliveries = assignments.filter((a: Doc<"deliveryAssignments">) =>
      ['assigned', 'accepted', 'picked_up', 'in_transit'].includes(a.status)
    ).length;

    // Calculate average delivery time
    const completedWithTimes = assignments.filter((a) =>
      a.status === 'delivered' && a.actual_pickup_time !== undefined && a.actual_delivery_time !== undefined
    );

    const avgDeliveryTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum: number, a) =>
        sum + (a.actual_delivery_time! - a.actual_pickup_time!), 0
      ) / completedWithTimes.length
      : 0;

    // Get driver performance
    const driverStats = new Map<Id<"drivers"> | string, DriverStats>();
    for (const assignment of assignments) {
      const driverId = assignment.driver_id;
      if (!driverId) continue;

      if (!driverStats.has(driverId)) {
        driverStats.set(driverId, {
          totalDeliveries: 0,
          completedDeliveries: 0,
          failedDeliveries: 0,
          totalRating: 0,
          ratingCount: 0,
        });
      }

      const stats = driverStats.get(driverId)!;
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
      query = query.filter((q: any) => q.eq(q.field("is_active"), args.isActive));
    }

    return await query.collect();
  },
});

// Get delivery person by order ID (returns driver info with phone, name, location)
export const getDeliveryPersonByOrderId = query({
  args: {
    orderId: v.string(), // Can be order_id string or Convex document ID
  },
  handler: async (ctx, args) => {
    // First, find the order by order_id string or document ID
    let order: Doc<"orders"> | null = null;

    // Try to get by document ID if it looks like a Convex ID
    if (args.orderId.match(/^[a-z][a-z0-9]*$/)) {
      try {
        const potentialOrder = await ctx.db.get(args.orderId as any);
        // Verify it's an order
        if (potentialOrder && ('order_id' in potentialOrder || 'customer_id' in potentialOrder)) {
          order = potentialOrder as Doc<"orders">;
        }
      } catch (error) {
        order = null;
      }
    }

    // If not found by document ID, search by order_id field
    if (!order) {
      order = await ctx.db
        .query('orders')
        .filter((q: any) => q.eq(q.field('order_id'), args.orderId))
        .first();
    }

    if (!order) {
      return null;
    }

    // Get delivery assignment for this order
    const assignment = await ctx.db
      .query('deliveryAssignments')
      .filter((q: any) => q.eq(q.field('order_id'), order._id))
      .first();

    if (!assignment) {
      return null;
    }

    // Get driver info
    if (!assignment.driver_id) {
      return null;
    }
    const driver = await ctx.db.get(assignment.driver_id);

    if (!driver) {
      return null;
    }

    return {
      id: driver._id,
      name: driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Delivery Driver',
      phone: driver.phone || null,
      location: driver.currentLocation || null,
      vehicleType: driver.vehicleType || null,
      rating: driver.rating || null,
    };
  },
});