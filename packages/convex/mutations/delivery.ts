import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Validators
const deliveryStatusValidator = v.union(
  v.literal('accepted'),
  v.literal('picked_up'),
  v.literal('in_transit'),
  v.literal('delivered'),
  v.literal('failed')
) as any;

// Assign delivery to driver handler
const assignDeliveryHandler = async (ctx: any, args: any): Promise<any> => {
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
};

// Assign delivery to driver
export const assignDelivery = mutation({
  args: {
    orderId: v.string(),
    driverId: v.string(),
    assignedBy: v.string(),
    estimatedPickupTime: v.optional(v.number()),
    estimatedDeliveryTime: v.optional(v.number()),
    pickupInstructions: v.optional(v.string()),
    deliveryInstructions: v.optional(v.string()),
    metadata: v.optional(v.any()),
  } as any,
  handler: assignDeliveryHandler,
});

// Update delivery status handler
const updateDeliveryStatusHandler = async (ctx: any, args: any): Promise<any> => {
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

  console.log(`Delivery status updated for assignment ${args.assignmentId} to ${args.status}`);
  return await ctx.db.get(args.assignmentId);
};

// Update delivery status
export const updateDeliveryStatus = mutation({
  args: {
    assignmentId: v.string(),
    driverId: v.string(),
    status: deliveryStatusValidator,
    accuracy: v.optional(v.number()),
  }) as any),
  notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  } as any,
  handler: updateDeliveryStatusHandler,
});

// Update driver location handler
const updateDriverLocationHandler = async (ctx: any, args: any): Promise<any> => {
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
};

// Update driver location
export const updateDriverLocation = mutation({
  args: {
    driverId: v.string(),
    longitude: v.number(),
  }) as any,
  v.literal('on_delivery')
    ) as any),
metadata: v.optional(v.any()),
  } as any,
  handler: updateDriverLocationHandler,
});

// Update driver status handler
const updateDriverStatusHandler = async (ctx: any, args: any): Promise<any> => {
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
};

// Update driver status
export const updateDriverStatus = mutation({
  args: {
    driverId: v.string(),
    v.literal('suspended')
    ) as any,
  reason: v.optional(v.string()),
    updatedBy: v.string(),
      metadata: v.optional(v.any()),
  } as any,
  handler: updateDriverStatusHandler,
});

// Rate delivery handler
const rateDeliveryHandler = async (ctx: any, args: any): Promise<any> => {
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
};

// Rate delivery
export const rateDelivery = mutation({
  args: {
    assignmentId: v.string(),
    rating: v.number(),
    feedback: v.optional(v.string()),
    ratedBy: v.string(),
    metadata: v.optional(v.any()),
  } as any,
  handler: rateDeliveryHandler,
});