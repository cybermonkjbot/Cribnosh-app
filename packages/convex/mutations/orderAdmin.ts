import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Id, Doc } from '../_generated/dataModel';
import { 
  handleConvexError,
  ErrorFactory 
} from '../../../apps/web/lib/errors/convex-exports';
import { ErrorCode } from '../../../apps/web/lib/errors/convex-exports';

// Order Management Mutations
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id('orders'),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('preparing'),
      v.literal('ready'),
      v.literal('delivered'),
      v.literal('cancelled'),
      v.literal('completed')
    ),
    reason: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      const order = await ctx.db.get(args.orderId);
      if (!order) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Order not found');
      }

      // Update order status
      await ctx.db.patch(args.orderId, {
        order_status: args.status,
        updatedAt: Date.now()
      });

      const orderStatus = (order as Doc<'orders'> & { order_status?: string }).order_status || 'unknown';

      // Log the activity
      await ctx.runMutation(api.mutations.admin.logActivity, {
        type: 'order_status_update',
        description: `Order status updated to ${args.status}`,
        metadata: {
          entityId: args.orderId,
          entityType: 'order',
          details: {
            oldStatus: orderStatus,
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

export const sendOrderNotification = mutation({
  args: {
    orderId: v.id('orders'),
    notificationType: v.union(
      v.literal('status_update'),
      v.literal('delay_warning'),
      v.literal('issue_alert'),
      v.literal('completion_reminder')
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
      const order = await ctx.db.get(args.orderId);
      if (!order) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Order not found');
      }

      const orderWithCustomerId = order as Doc<'orders'> & { customer_id?: Id<'users'> };

      // Create notification for customer
      await ctx.db.insert('notifications', {
        userId: orderWithCustomerId.customer_id,
      type: 'order_notification',
      title: 'Order Update',
      message: args.message,
      data: {
        orderId: args.orderId,
        notificationType: args.notificationType,
        priority: args.priority || 'medium'
      },
        read: false,
        createdAt: Date.now()
      });

      // Log the activity
      await ctx.runMutation(api.mutations.admin.logActivity, {
        type: 'order_notification_sent',
        description: `Order notification sent: ${args.notificationType}`,
        metadata: {
          entityId: args.orderId,
          entityType: 'order',
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

export const flagOrderForReview = mutation({
  args: {
    orderId: v.id('orders'),
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
      const order = await ctx.db.get(args.orderId);
      if (!order) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Order not found');
      }

      // Create admin notification for review
      const orderIdString = args.orderId.toString();
      await ctx.db.insert('adminNotifications', {
        type: 'order_review',
        title: `Order Flagged for Review: #${orderIdString.slice(-8)}`,
      message: `Reason: ${args.reason}${args.notes ? `\nNotes: ${args.notes}` : ''}`,
      timestamp: Date.now(),
      priority: args.priority,
      category: 'order_management',
        actionUrl: `/admin/orders?order=${orderIdString}`,
        metadata: {
          orderId: orderIdString,
          reason: args.reason,
          notes: args.notes
        },
        resolved: false
      });

      // Log the activity
      await ctx.runMutation(api.mutations.admin.logActivity, {
        type: 'order_flagged_for_review',
        description: `Order flagged for review: ${args.reason}`,
        metadata: {
          entityId: args.orderId,
          entityType: 'order',
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
