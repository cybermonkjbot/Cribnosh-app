// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createDriver = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    vehicle: v.string(),
    vehicleType: v.union(
      v.literal('car'),
      v.literal('motorcycle'),
      v.literal('bicycle'),
      v.literal('scooter'),
      v.literal('van')
    ),
    experience: v.optional(v.number()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("drivers", {
      ...args,
      status: 'pending', // Default status for new applications
      availability: 'offline', // Default availability
      updatedAt: args.createdAt, // Set updatedAt to createdAt initially
    });
    return id;
  },
});

export const updateDriver = mutation({
  args: {
    id: v.id("drivers"),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('on_hold')
    ),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return { success: true };
  },
});

export const deleteDriver = mutation({
  args: {
    id: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Update driver profile fields
 */
export const updateDriverProfile = mutation({
  args: {
    driverId: v.id("drivers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    vehicle: v.optional(v.string()),
    vehicleType: v.optional(v.union(
      v.literal('car'),
      v.literal('motorcycle'),
      v.literal('bicycle'),
      v.literal('scooter'),
      v.literal('van')
    )),
    licenseNumber: v.optional(v.string()),
    experience: v.optional(v.number()),
    availability: v.optional(v.union(
      v.literal('available'),
      v.literal('busy'),
      v.literal('offline'),
      v.literal('on_delivery')
    )),
    currentLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      updatedAt: v.number(),
    })),
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    accountName: v.optional(v.string()),
    privacySettings: v.optional(v.object({
      locationSharing: v.optional(v.boolean()),
      analyticsTracking: v.optional(v.boolean()),
      marketingEmails: v.optional(v.boolean()),
      dataSharing: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const now = Date.now();
    const { driverId, ...updates } = args;

    await ctx.db.patch(args.driverId, {
      ...updates,
      updatedAt: now,
    });

    return await ctx.db.get(args.driverId);
  },
});

/**
 * Accept delivery assignment
 * Updates deliveryAssignments.status to "accepted" and driver availability to "busy"
 */
export const acceptOrder = mutation({
  args: {
    assignmentId: v.id("deliveryAssignments"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error('Delivery assignment not found');
    }

    // Verify driver owns this assignment
    if (assignment.driver_id !== args.driverId) {
      throw new Error('Driver does not own this assignment');
    }

    // Verify assignment is in "assigned" status
    if (assignment.status !== 'assigned') {
      throw new Error(`Cannot accept assignment with status: ${assignment.status}`);
    }

    const now = Date.now();

    // Update assignment status to "accepted"
    await ctx.db.patch(args.assignmentId, {
      status: 'accepted',
    });

    // Update driver availability to "busy"
    await ctx.db.patch(args.driverId, {
      availability: 'busy',
      updatedAt: now,
    });

    return await ctx.db.get(args.assignmentId);
  },
});

/**
 * Decline delivery assignment
 * Updates deliveryAssignments.status to "cancelled"
 */
export const declineOrder = mutation({
  args: {
    assignmentId: v.id("deliveryAssignments"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error('Delivery assignment not found');
    }

    // Verify driver owns this assignment
    if (assignment.driver_id !== args.driverId) {
      throw new Error('Driver does not own this assignment');
    }

    // Verify assignment is in "assigned" or "accepted" status
    if (!['assigned', 'accepted'].includes(assignment.status)) {
      throw new Error(`Cannot decline assignment with status: ${assignment.status}`);
    }

    // Update assignment status to "cancelled"
    await ctx.db.patch(args.assignmentId, {
      status: 'cancelled',
    });

    // Update driver availability back to "available" if it was "busy"
    const driver = await ctx.db.get(args.driverId);
    if (driver && driver.availability === 'busy') {
      await ctx.db.patch(args.driverId, {
        availability: 'available',
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.get(args.assignmentId);
  },
});

/**
 * Update delivery assignment status
 * Updates status to "picked_up", "in_transit", or "delivered"
 */
export const updateOrderStatus = mutation({
  args: {
    assignmentId: v.id("deliveryAssignments"),
    driverId: v.id("drivers"),
    status: v.union(
      v.literal('picked_up'),
      v.literal('in_transit'),
      v.literal('delivered')
    ),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.optional(v.number()),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error('Delivery assignment not found');
    }

    // Verify driver owns this assignment
    if (assignment.driver_id !== args.driverId) {
      throw new Error('Driver does not own this assignment');
    }

    const now = Date.now();

    // Update assignment status and timestamps
    const updateData: any = {
      status: args.status,
    };

    if (args.status === 'picked_up') {
      updateData.actual_pickup_time = now;
    } else if (args.status === 'delivered') {
      updateData.actual_delivery_time = now;
      if (args.notes) {
        updateData.delivery_notes = args.notes;
      }
    }

    await ctx.db.patch(args.assignmentId, updateData);

    // Add tracking entry
    await ctx.db.insert('deliveryTracking', {
      assignment_id: args.assignmentId,
      driver_id: args.driverId,
      location: args.location || { latitude: 0, longitude: 0, accuracy: 0 },
      status: 'status_update',
      timestamp: now,
      notes: args.notes,
    });

    // Update driver availability based on status
    if (args.status === 'delivered') {
      await ctx.db.patch(args.driverId, {
        availability: 'available',
        updatedAt: now,
      });

      // Update order status
      await ctx.db.patch(assignment.order_id, {
        order_status: 'delivered',
        delivered_at: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(args.driverId, {
        availability: 'on_delivery',
        updatedAt: now,
      });
    }

    return await ctx.db.get(args.assignmentId);
  },
});

/**
 * Upload document to driver's documents array
 */
export const uploadDocument = mutation({
  args: {
    driverId: v.id("drivers"),
    type: v.string(), // "license", "registration", "insurance", "photo"
    url: v.string(),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const now = Date.now();
    const documents = driver.documents || [];

    // Check if document of this type already exists
    const existingDocIndex = documents.findIndex((doc: any) => doc.type === args.type);

    const newDocument = {
      type: args.type,
      url: args.url,
      verified: args.verified || false,
      verifiedAt: args.verified ? now : undefined,
    };

    if (existingDocIndex >= 0) {
      // Update existing document
      documents[existingDocIndex] = newDocument;
    } else {
      // Add new document
      documents.push(newDocument);
    }

    await ctx.db.patch(args.driverId, {
      documents,
      updatedAt: now,
    });

    return await ctx.db.get(args.driverId);
  },
});

/**
 * Register a new driver with complete profile information
 */
export const registerDriver = mutation({
  args: {
    // User information
    userId: v.optional(v.id("users")),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    // Vehicle information
    vehicleType: v.string(),
    vehicleModel: v.string(),
    vehicleYear: v.string(),
    licensePlate: v.string(),
    // Documents
    driversLicense: v.string(), // URL or file ID
    driversLicenseFileId: v.optional(v.string()),
    vehicleRegistration: v.string(), // URL or file ID
    vehicleRegistrationFileId: v.optional(v.string()),
    insurance: v.string(), // URL or file ID
    insuranceFileId: v.optional(v.string()),
    // Bank information
    bankName: v.string(),
    bankCode: v.string(),
    accountNumber: v.string(),
    accountName: v.string(),
    // Work type
    workType: v.optional(v.union(
      v.literal('independent'),
      v.literal('supplier')
    )),
    supplierId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if driver already exists with this email
    const existingDriver = await ctx.db
      .query('drivers')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();
    
    if (existingDriver) {
      throw new Error('A driver with this email already exists');
    }

    // Prepare documents array
    const documents = [
      {
        type: 'driversLicense',
        url: args.driversLicense,
        fileId: args.driversLicenseFileId,
        verified: false,
      },
      {
        type: 'vehicleRegistration',
        url: args.vehicleRegistration,
        fileId: args.vehicleRegistrationFileId,
        verified: false,
      },
      {
        type: 'insurance',
        url: args.insurance,
        fileId: args.insuranceFileId,
        verified: false,
      },
    ];

    // Create driver record
    const driverId = await ctx.db.insert('drivers', {
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      name: `${args.firstName} ${args.lastName}`,
      email: args.email,
      phone: args.phoneNumber,
      vehicleType: args.vehicleType,
      vehicleModel: args.vehicleModel,
      vehicleYear: args.vehicleYear,
      licensePlate: args.licensePlate,
      documents,
      bankName: args.bankName,
      bankCode: args.bankCode,
      accountNumber: args.accountNumber,
      accountName: args.accountName,
      workType: args.workType || 'independent',
      supplierId: args.supplierId,
      status: 'pending',
      availability: 'offline',
      rating: 0,
      totalDeliveries: 0,
      totalEarnings: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      driverId,
      userId: args.userId,
    };
  },
});
