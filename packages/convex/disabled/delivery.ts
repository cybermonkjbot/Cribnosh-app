import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
// @ts-nocheck

// Assign delivery to driver
// Validators
const assignDeliveryArgs = {
  orderId: v.id("orders"),
  driverId: v.id("drivers"),
  assignedBy: v.id("users"),
  estimatedPickupTime: v.optional(v.number()),
  estimatedDeliveryTime: v.optional(v.number()),
  pickupInstructions: v.optional(v.string()),
  deliveryInstructions: v.optional(v.string()),
  metadata: v.optional(v.any()),
};

// Assign delivery to driver
export const assignDelivery = mutation({
  args: assignDeliveryArgs,
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const now = Date.now();

    // Create delivery assignment
    const assignmentId = await ctx.db.insert('deliveryAssignments', {
      order_id: args.orderId,
      driver_id: args.driverId,
      assigned_by: args.assignedBy,
      assigned_at: now,
      estimated_pickup_time: args.estimatedPickupTime,
      estimated_delivery_time: args.estimatedDeliveryTime,
      pickup_location: {
        latitude: 0, // Will be updated with actual chef location
        longitude: 0,
        address: typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address),
        instructions: args.pickupInstructions,
      },
      delivery_location: {
        latitude: 0, // Will be updated with actual delivery location
        longitude: 0,
        address: typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address),
        instructions: args.deliveryInstructions,
      },
      status: 'assigned',
      metadata: args.metadata,
    });

    // Update driver availability
    await ctx.db.patch(args.driverId, {
      availability: 'busy',
      updatedAt: now,
    });

    // Update order status to indicate delivery assigned
    await ctx.db.patch(args.orderId, {
      order_status: 'ready',
      updatedAt: now,
    });

    console.log(`Delivery assigned for order ${args.orderId} to driver ${args.driverId}`);
    return await ctx.db.get(assignmentId);
  },
});

const assignExternalDeliveryArgs = {
  orderId: v.id("orders"),
  provider: v.string(), // e.g., 'stuart'
  externalId: v.string(), // External Job ID
  externalStatus: v.optional(v.string()),
  externalTrackingUrl: v.optional(v.string()),
  assignedBy: v.optional(v.id("users")),
  pickupLocation: v.object({
    address: v.string(),
    instructions: v.optional(v.string()),
  }),
  deliveryLocation: v.object({
    address: v.string(),
    instructions: v.optional(v.string()),
  }),
  estimated_pickup_time: v.optional(v.number()),
  estimated_delivery_time: v.optional(v.number()),
  metadata: v.optional(v.any()),
};

// Assign external delivery (e.g., Stuart)
export const assignExternalDelivery = mutation({
  args: assignExternalDeliveryArgs,
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Create delivery assignment without driver_id
    const assignmentId = await ctx.db.insert('deliveryAssignments', {
      order_id: args.orderId,
      provider: args.provider,
      external_id: args.externalId,
      external_status: args.externalStatus,
      external_tracking_url: args.externalTrackingUrl,
      assigned_by: args.assignedBy,
      assigned_at: now,
      estimated_pickup_time: args.estimated_pickup_time,
      estimated_delivery_time: args.estimated_delivery_time,
      pickup_location: {
        latitude: 0, // Not tracked for external
        longitude: 0,
        address: args.pickupLocation.address,
        instructions: args.pickupLocation.instructions,
      },
      delivery_location: {
        latitude: 0,
        longitude: 0,
        address: args.deliveryLocation.address,
        instructions: args.deliveryLocation.instructions,
      },
      status: 'assigned',
      metadata: args.metadata,
    });

    // Update order status to indicate delivery assigned
    await ctx.db.patch(args.orderId, {
      order_status: 'ready',
      updatedAt: now,
    });

    console.log(`External delivery assigned for order ${args.orderId} to provider ${args.provider} (ID: ${args.externalId})`);
    return await ctx.db.get(assignmentId);
  },
});

const updateDeliveryStatusArgs = {
  assignmentId: v.id("deliveryAssignments"),
  driverId: v.id("drivers"),
  status: v.union(
    v.literal('accepted'),
    v.literal('picked_up'),
    v.literal('in_transit'),
    v.literal('delivered'),
    v.literal('failed'),
    v.literal('cancelled')
  ),
  location: v.optional(v.object({
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
  })),
  notes: v.optional(v.string()),
  metadata: v.optional(v.any()),
};

// Update delivery status
export const updateDeliveryStatus = mutation({
  args: updateDeliveryStatusArgs,
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error('Delivery assignment not found');
    }

    const now = Date.now();

    // Update assignment status
    const updateData: any = {
      status: args.status,
      metadata: { ...assignment.metadata, ...args.metadata },
    };

    // Set actual times based on status
    if (args.status === 'picked_up') {
      updateData.actual_pickup_time = now;
    } else if (args.status === 'delivered') {
      updateData.actual_delivery_time = now;
      updateData.delivery_notes = args.notes;
    } else if (args.status === 'failed') {
      updateData.delivery_notes = args.notes;
    }

    await ctx.db.patch(args.assignmentId, updateData);

    // Add tracking entry
    await ctx.db.insert('deliveryTracking', {
      assignment_id: args.assignmentId,
      driver_id: args.driverId,
      location: args.location || { latitude: 0, longitude: 0 },
      status: 'status_update',
      timestamp: now,
      notes: args.notes,
      metadata: args.metadata,
    });

    // Update driver availability based on status
    let driverAvailability: 'available' | 'busy' | 'offline' | 'on_delivery' = 'available';
    if (['accepted', 'picked_up', 'in_transit'].includes(args.status)) {
      driverAvailability = 'on_delivery';
    } else if (args.status === 'delivered' || args.status === 'failed') {
      driverAvailability = 'available';
    }

    await ctx.db.patch(args.driverId, {
      availability: driverAvailability,
      updatedAt: now,
    });

    // Update order status if delivered
    if (args.status === 'delivered') {
      await ctx.db.patch(assignment.order_id, {
        order_status: 'delivered',
        delivered_at: now,
        updatedAt: now,
      });
    }

    // Handle Cancellation for External Providers
    if (args.status === 'cancelled' && assignment.provider === 'stuart' && assignment.external_id) {
      await ctx.scheduler.runAfter(0, internal.stuart_integration.cancelJob, {
        jobId: assignment.external_id,
        reason: args.notes || 'job_cancelled',
      });
    }

    console.log(`Delivery status updated for assignment ${args.assignmentId} to ${args.status}`);
    return await ctx.db.get(args.assignmentId);
  },
});

const updateDriverLocationArgs = {
  driverId: v.id("drivers"),
  location: v.object({
    latitude: v.number(),
    longitude: v.number(),
  }),
  availability: v.optional(v.union(
    v.literal('available'),
    v.literal('busy'),
    v.literal('offline'),
    v.literal('on_delivery')
  )),
  metadata: v.optional(v.any()),
};

// Update driver location
export const updateDriverLocation = mutation({
  args: updateDriverLocationArgs,
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const now = Date.now();

    // Update driver location and availability
    await ctx.db.patch(args.driverId, {
      currentLocation: {
        latitude: args.location.latitude,
        longitude: args.location.longitude,
        updatedAt: now,
      },
      availability: args.availability || driver.availability,
      updatedAt: now,
    });

    console.log(`Driver location updated for ${args.driverId}`);
    return await ctx.db.get(args.driverId);
  },
});

const updateDriverStatusArgs = {
  driverId: v.id("drivers"),
  status: v.union(
    v.literal('pending'),
    v.literal('approved'),
    v.literal('rejected'),
    v.literal('on_hold'),
    v.literal('active'),
    v.literal('inactive'),
    v.literal('suspended')
  ),
  reason: v.optional(v.string()),
  updatedBy: v.id("users"),
  metadata: v.optional(v.any()),
};

// Update driver status
export const updateDriverStatus = mutation({
  args: updateDriverStatusArgs,
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const now = Date.now();

    // Update driver status
    await ctx.db.patch(args.driverId, {
      status: args.status,
      updatedAt: now,
    });

    console.log(`Driver status updated for ${args.driverId} to ${args.status}`);
    return await ctx.db.get(args.driverId);
  },
});

const rateDeliveryArgs = {
  assignmentId: v.id("deliveryAssignments"),
  rating: v.number(),
  feedback: v.optional(v.string()),
  ratedBy: v.id("users"),
  metadata: v.optional(v.any()),
};

// Rate delivery
export const rateDelivery = mutation({
  args: rateDeliveryArgs,
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error('Delivery assignment not found');
    }

    const now = Date.now();

    // Update assignment with rating
    await ctx.db.patch(args.assignmentId, {
      customer_rating: args.rating,
      customer_feedback: args.feedback,
      metadata: { ...assignment.metadata, rating: args.metadata },
    });

    // Update driver rating
    if (assignment.driver_id) {
      const driver = await ctx.db.get(assignment.driver_id);
      if (driver) {
        const currentRating = driver.rating || 0;
        const totalDeliveries = driver.totalDeliveries || 0;
        const newRating = totalDeliveries > 0
          ? ((currentRating * totalDeliveries) + args.rating) / (totalDeliveries + 1)
          : args.rating;

        await ctx.db.patch(assignment.driver_id, {
          rating: newRating,
          totalDeliveries: totalDeliveries + 1,
          updatedAt: now,
        });
      }
    }

    console.log(`Delivery rated for assignment ${args.assignmentId} with rating ${args.rating}`);
    return await ctx.db.get(args.assignmentId);
  },
});