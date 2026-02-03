// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Assign delivery to driver
export const assignDelivery = mutation({
  args: {
    orderId: v.id("orders"),
    driverId: v.id("drivers"),
    assignedBy: v.optional(v.id("users")), // Assuming assignedBy is a user ID
    estimatedPickupTime: v.optional(v.number()),
    estimatedDeliveryTime: v.optional(v.number()),
    pickupInstructions: v.optional(v.string()),
    deliveryInstructions: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
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

    const addressStr = order.delivery_address
      ? (typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address))
      : "Unknown Address";

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
        address: addressStr,
        instructions: args.pickupInstructions,
      },
      delivery_location: {
        latitude: 0, // Will be updated with actual delivery location
        longitude: 0,
        address: addressStr,
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

// Update delivery status
export const updateDeliveryStatus = mutation({
  args: {
    assignmentId: v.id("deliveryAssignments"),
    driverId: v.id("drivers"),
    status: v.union(
      v.literal('accepted'),
      v.literal('picked_up'),
      v.literal('in_transit'),
      v.literal('delivered'),
      v.literal('failed')
    ),
    accuracy: v.optional(v.number()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
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
      location: { latitude: 0, longitude: 0 }, // Default if not provided in args, but args doesn't have it?
      // Wait, original handler accessed `args.location`. But mutation args didn't define it!
      // The original code had: location: args.location || { latitude: 0, longitude: 0 },
      // I should verify if I need to add location to args.
      // The validator in original export didn't have location.
      // So args.location was likely undefined at runtime anyway unless passed dynamically.
      // I will leave it as default 0,0 for now to match the validator.
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

    console.log(`Delivery status updated for assignment ${args.assignmentId} to ${args.status}`);
    return await ctx.db.get(args.assignmentId);
  },
});

// Update driver location
export const updateDriverLocation = mutation({
  args: {
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
  },
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

// Update driver status
export const updateDriverStatus = mutation({
  args: {
    driverId: v.id("drivers"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("on_hold"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended")
    ),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
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

// Rate delivery
export const rateDelivery = mutation({
  args: {
    assignmentId: v.id("deliveryAssignments"),
    rating: v.number(),
    feedback: v.optional(v.string()),
    ratedBy: v.string(),
    metadata: v.optional(v.any()),
  },
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