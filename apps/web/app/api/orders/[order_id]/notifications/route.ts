import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /orders/{order_id}/notifications:
 *   get:
 *     summary: Get Order Notifications
 *     description: Retrieve all notifications related to a specific order
 *     tags: [Orders, Order Management, Notifications]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "ORD-12345"
 *     responses:
 *       200:
 *         description: Order notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: "ORD-12345"
 *                     notifications:
 *                       type: array
 *                       description: Array of order notifications
 *                       items:
 *                         type: object
 *                         properties:
 *                           notificationId:
 *                             type: string
 *                             description: Notification ID
 *                             example: "NOTIF-12345"
 *                           type:
 *                             type: string
 *                             description: Notification type
 *                             example: "order_confirmed"
 *                           title:
 *                             type: string
 *                             description: Notification title
 *                             example: "Order Confirmed"
 *                           message:
 *                             type: string
 *                             description: Notification message
 *                             example: "Your order has been confirmed by Chef Mario"
 *                           recipientId:
 *                             type: string
 *                             description: ID of the notification recipient
 *                             example: "j1234567890abcdef"
 *                           recipientRole:
 *                             type: string
 *                             description: Role of the recipient
 *                             example: "customer"
 *                           status:
 *                             type: string
 *                             enum: [sent, delivered, read, failed]
 *                             description: Notification status
 *                             example: "delivered"
 *                           channel:
 *                             type: string
 *                             enum: [email, sms, push, in_app]
 *                             description: Notification channel
 *                             example: "email"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             description: When the notification was sent
 *                             example: "2024-01-15T10:00:00.000Z"
 *                           readAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: When the notification was read
 *                             example: "2024-01-15T10:05:00.000Z"
 *                           metadata:
 *                             type: object
 *                             description: Additional notification metadata
 *                             example: {"priority": "high", "template": "order_confirmation"}
 *                     totalCount:
 *                       type: number
 *                       description: Total number of notifications
 *                       example: 5
 *                     unreadCount:
 *                       type: number
 *                       description: Number of unread notifications
 *                       example: 2
 *                 message:
 *                   type: string
 *                   example: "Order notifications retrieved successfully"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to view notifications for this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/notifications/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const convex = getConvexClient();

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to view this specific order
    if (user.roles?.includes('customer') && order.customer_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }
    if (user.roles?.includes('chef') && order.chef_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }

    // Get order notifications
    const notifications = await convex.query(api.queries.orders.getOrderNotifications, { orderId: order_id });

    // Format notifications
    const formattedNotifications = notifications.map((notification: { _id: string; notification_type?: string; message?: string; priority?: string; channels?: string[]; sent_by?: string; sent_at?: number; status?: string; metadata?: Record<string, unknown> }) => ({
      id: notification._id,
      type: notification.notification_type,
      message: notification.message,
      priority: notification.priority,
      channels: notification.channels,
      sentBy: notification.sent_by,
      sentAt: new Date(notification.sent_at || 0).toISOString(),
      status: notification.status,
      metadata: notification.metadata || {}
    }));

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      notifications: formattedNotifications,
      totalNotifications: formattedNotifications.length
    });

  } catch (error: unknown) {
    logger.error('Get order notifications error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get order notifications.') 
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 