import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Doc, Id } from '../_generated/dataModel';
import { 
  handleConvexError,
  ErrorFactory 
} from '../../../apps/web/lib/errors/convex-exports';
import { ErrorCode } from '../../../apps/web/lib/errors/convex-exports';

// Delivery Management Mutations
export const updateDeliveryStatus = mutation({
  args: {
    deliveryId: v.id('deliveries'),
    status: v.union(
      v.literal('assigned'),
      v.literal('picked_up'),
      v.literal('in_transit'),
      v.literal('delivered'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    reason: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      const delivery = await ctx.db.get(args.deliveryId);
      if (!delivery) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Delivery not found');
      }

      // Update delivery status
      await ctx.db.patch(args.deliveryId, {
        status: args.status,
        updatedAt: Date.now()
      });

      // Log the activity
      await ctx.runMutation(api.mutations.admin.logActivity, {
        type: 'delivery_status_update',
        description: `Delivery status updated to ${args.status}`,
        metadata: {
          entityId: args.deliveryId,
          entityType: 'delivery',
          details: {
            oldStatus: (delivery as Doc<'deliveries'> & { status?: string }).status || 'unknown',
            newStatus: args.status,
            reason: args.reason
          }
        }
      });

      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const assignDriver = mutation({
  args: {
    deliveryId: v.id('deliveries'),
    driverId: v.id('drivers'),
    reason: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      const delivery = await ctx.db.get(args.deliveryId);
      if (!delivery) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Delivery not found');
      }

      const driver = await ctx.db.get(args.driverId);
      if (!driver) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Driver not found');
      }

      // Update delivery with driver assignment
      await ctx.db.patch(args.deliveryId, {
        driverId: args.driverId,
        status: 'assigned',
        updatedAt: Date.now()
      });

      // Update driver status to on_delivery
      await ctx.db.patch(args.driverId, {
        availability: 'on_delivery',
        updatedAt: Date.now()
      });

      // Log the activity
      const driverName = (driver as Doc<'drivers'> & { name?: string }).name || 'Unknown';
      await ctx.runMutation(api.mutations.admin.logActivity, {
        type: 'driver_assigned',
        description: `Driver ${driverName} assigned to delivery`,
        metadata: {
          entityId: args.deliveryId,
          entityType: 'delivery',
          details: {
            driverId: args.driverId,
            driverName: driverName,
            reason: args.reason
          }
        }
      });

      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const sendDeliveryNotification = mutation({
  args: {
    deliveryId: v.id('deliveries'),
    notificationType: v.union(
      v.literal('status_update'),
      v.literal('delay_warning'),
      v.literal('delivery_alert'),
      v.literal('completion_notification')
    ),
    message: v.string(),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ))
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      const delivery = await ctx.db.get(args.deliveryId);
      if (!delivery) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Delivery not found');
      }

      // Get order to find customer
      const deliveryWithOrderId = delivery as Doc<'deliveries'> & { orderId?: Id<'orders'> };
      const order = deliveryWithOrderId.orderId ? await ctx.db.get(deliveryWithOrderId.orderId) : null;
      if (!order) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Order not found');
      }

      // Create notification for customer
      const orderWithCustomerId = order as Doc<'orders'> & { customer_id?: Id<'users'> };
      await ctx.db.insert('notifications', {
        userId: orderWithCustomerId.customer_id,
        type: 'delivery_notification',
        title: 'Delivery Update',
        message: args.message,
        data: {
          deliveryId: args.deliveryId,
          notificationType: args.notificationType,
          priority: args.priority || 'medium'
        },
        read: false,
        createdAt: Date.now()
      });

      // Log the activity
      await ctx.runMutation(api.mutations.admin.logActivity, {
        type: 'delivery_notification_sent',
        description: `Delivery notification sent: ${args.notificationType}`,
        metadata: {
          entityId: args.deliveryId,
          entityType: 'delivery',
          details: {
            notificationType: args.notificationType,
            priority: args.priority || 'medium'
          }
        }
      });

      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const flagDeliveryForReview = mutation({
  args: {
    deliveryId: v.id('deliveries'),
    reason: v.string(),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    notes: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      const delivery = await ctx.db.get(args.deliveryId);
      if (!delivery) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Delivery not found');
      }

      // Create admin notification for review
      await ctx.db.insert('adminNotifications', {
        type: 'delivery_review',
        title: `Delivery Flagged for Review: #${args.deliveryId.slice(-8)}`,
        message: `Reason: ${args.reason}${args.notes ? `\nNotes: ${args.notes}` : ''}`,
        timestamp: Date.now(),
        priority: args.priority,
        category: 'delivery_management',
        actionUrl: `/admin/delivery?delivery=${args.deliveryId}`,
        metadata: {
          deliveryId: args.deliveryId,
          reason: args.reason,
          notes: args.notes
        },
        resolved: false
      });

      // Log the activity
      await ctx.runMutation(api.mutations.admin.logActivity, {
        type: 'delivery_flagged_for_review',
        description: `Delivery flagged for review: ${args.reason}`,
        metadata: {
          entityId: args.deliveryId,
          entityType: 'delivery',
          details: {
            reason: args.reason,
            priority: args.priority,
            notes: args.notes
          }
        }
      });

      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const updateDriverLocation = mutation({
  args: {
    driverId: v.id('drivers'),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
      lastUpdated: v.number()
    })
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      const driver = await ctx.db.get(args.driverId);
      if (!driver) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Driver not found');
      }

      // Update driver location
      await ctx.db.patch(args.driverId, {
        currentLocation: {
          ...args.location,
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      });

      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});
