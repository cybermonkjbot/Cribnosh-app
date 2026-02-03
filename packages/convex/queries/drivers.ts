// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';

export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { limit, offset = 0 } = args;

    // Fetch all drivers (will be optimized with index in schema if needed)
    const allDrivers = await ctx.db.query('drivers').collect();

    // Sort by creation time desc (newest first)
    allDrivers.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));

    // Apply pagination
    if (limit !== undefined) {
      return allDrivers.slice(offset, offset + limit);
    }

    // If no limit, return all from offset
    return allDrivers.slice(offset);
  }
});

/**
 * Get driver profile by user ID (match by email)
 * Drivers are linked to users by matching email addresses
 */
export const getByUserId = query({
  args: {
    userId: v.id('users'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user to get email
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Find driver by matching email
    const driver = await ctx.db
      .query('drivers')
      .filter(q => q.eq(q.field('email'), user.email))
      .first();

    return driver || null;
  },
});

/**
 * Get driver profile by email
 */
export const getByEmail = query({
  args: {
    email: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db
      .query('drivers')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();

    return driver || null;
  },
});

/**
 * Get orders assigned to driver via deliveryAssignments
 * Returns orders with assignment details
 */
export const getOrdersByDriver = query({
  args: {
    driverId: v.id('drivers'),
    status: v.optional(v.union(
      v.literal('assigned'),
      v.literal('accepted'),
      v.literal('picked_up'),
      v.literal('in_transit'),
      v.literal('delivered'),
      v.literal('failed'),
      v.literal('cancelled')
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get all assignments for this driver
    let assignments = await ctx.db
      .query('deliveryAssignments')
      .withIndex('by_driver', q => q.eq('driver_id', args.driverId))
      .collect();

    // Filter by status if provided
    if (args.status) {
      assignments = assignments.filter(a => a.status === args.status);
    }

    // Sort by assigned_at (newest first)
    assignments.sort((a, b) => b.assigned_at - a.assigned_at);

    // Apply pagination
    const paginatedAssignments = assignments.slice(offset, offset + limit);

    // Get full order details for each assignment
    const ordersWithAssignments = await Promise.all(
      paginatedAssignments.map(async (assignment) => {
        const order = await ctx.db.get(assignment.order_id);
        return {
          ...order,
          assignment: {
            _id: assignment._id,
            status: assignment.status,
            assigned_at: assignment.assigned_at,
            estimated_pickup_time: assignment.estimated_pickup_time,
            estimated_delivery_time: assignment.estimated_delivery_time,
            actual_pickup_time: assignment.actual_pickup_time,
            actual_delivery_time: assignment.actual_delivery_time,
            pickup_location: assignment.pickup_location,
            delivery_location: assignment.delivery_location,
            delivery_notes: assignment.delivery_notes,
            customer_rating: assignment.customer_rating,
            customer_feedback: assignment.customer_feedback,
          },
        };
      })
    );

    return ordersWithAssignments;
  },
});

/**
 * Calculate earnings from completed deliveries
 * Returns total earnings, earnings by period, and completed deliveries count
 */
export const getEarningsByDriver = query({
  args: {
    driverId: v.id('drivers'),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || Date.now();

    // Get all completed assignments for this driver in date range
    const assignments = await ctx.db
      .query('deliveryAssignments')
      .withIndex('by_driver', q => q.eq('driver_id', args.driverId))
      .filter(q => q.eq(q.field('status'), 'delivered'))
      .filter(q => q.gte(q.field('assigned_at'), startDate))
      .filter(q => q.lte(q.field('assigned_at'), endDate))
      .collect();

    // Calculate earnings from orders
    let totalEarnings = 0;
    const completedDeliveries = assignments.length;

    for (const assignment of assignments) {
      const order = await ctx.db.get(assignment.order_id);
      if (order) {
        // Calculate driver earnings (typically a percentage of order total or fixed fee)
        // For now, assume 10% of order total or minimum £5 per delivery
        const orderTotal = order.total_amount || 0;
        const driverEarnings = Math.max(orderTotal * 0.1, 5);
        totalEarnings += driverEarnings;
      }
    }

    // Calculate earnings by period (daily, weekly, monthly)
    const dailyEarnings: Record<string, number> = {};
    const weeklyEarnings: Record<string, number> = {};
    const monthlyEarnings: Record<string, number> = {};

    for (const assignment of assignments) {
      const order = await ctx.db.get(assignment.order_id);
      if (order) {
        const orderTotal = order.total_amount || 0;
        const driverEarnings = Math.max(orderTotal * 0.1, 5);
        const date = new Date(assignment.assigned_at);

        // Daily
        const dayKey = date.toISOString().split('T')[0];
        dailyEarnings[dayKey] = (dailyEarnings[dayKey] || 0) + driverEarnings;

        // Weekly (ISO week)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        weeklyEarnings[weekKey] = (weeklyEarnings[weekKey] || 0) + driverEarnings;

        // Monthly
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + driverEarnings;
      }
    }

    return {
      totalEarnings,
      completedDeliveries,
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      period: {
        startDate,
        endDate,
      },
    };
  },
});

/**
 * Get driver documents
 */
export const getDocumentsByDriver = query({
  args: {
    driverId: v.id('drivers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      return null;
    }

    return driver.documents || [];
  },
}); 