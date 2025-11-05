import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/notifications/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const convex = getConvexClient();

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id as any });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to view this specific order
    if (payload.role === 'customer' && order.customer_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }
    if (payload.role === 'chef' && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }

    // Get order notifications
    const notifications = await convex.query(api.queries.orders.getOrderNotifications, { orderId: order_id as any });

    // Format notifications
    const formattedNotifications = notifications.map((notification: any) => ({
      id: notification._id,
      type: notification.notification_type,
      message: notification.message,
      priority: notification.priority,
      channels: notification.channels,
      sentBy: notification.sent_by,
      sentAt: new Date(notification.sent_at).toISOString(),
      status: notification.status,
      metadata: notification.metadata || {}
    }));

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      notifications: formattedNotifications,
      totalNotifications: formattedNotifications.length
    });

  } catch (error: any) {
    console.error('Get order notifications error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to get order notifications.' 
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 