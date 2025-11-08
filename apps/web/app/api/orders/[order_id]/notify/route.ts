import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

interface SendNotificationRequest {
  notificationType: 'order_confirmed' | 'order_preparing' | 'order_ready' | 'order_delivered' | 'order_completed' | 'order_cancelled' | 'order_updated' | 'custom';
  message?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/{order_id}/notify:
 *   post:
 *     summary: Send Order Notification
 *     description: Send a notification to order participants (admin, staff, chef only)
 *     tags: [Orders, Order Management, Notifications]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "ORD-12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationType
 *               - priority
 *               - channels
 *             properties:
 *               notificationType:
 *                 type: string
 *                 enum: [order_confirmed, order_preparing, order_ready, order_delivered, order_completed, order_cancelled, order_updated, custom]
 *                 description: Type of notification to send
 *                 example: "order_ready"
 *               message:
 *                 type: string
 *                 description: Custom message (optional, uses default template if not provided)
 *                 example: "Your order is ready for pickup!"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Notification priority level
 *                 example: "high"
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms, push, in_app]
 *                 description: Notification channels to use
 *                 example: ["email", "push", "in_app"]
 *               metadata:
 *                 type: object
 *                 description: Additional notification metadata
 *                 example: {"template": "order_ready", "urgency": "normal"}
 *     responses:
 *       200:
 *         description: Notification sent successfully
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
 *                     notificationId:
 *                       type: string
 *                       description: Generated notification ID
 *                       example: "NOTIF-12345"
 *                     orderId:
 *                       type: string
 *                       example: "ORD-12345"
 *                     notificationType:
 *                       type: string
 *                       example: "order_ready"
 *                     message:
 *                       type: string
 *                       example: "Your order is ready for pickup!"
 *                     priority:
 *                       type: string
 *                       example: "high"
 *                     channels:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["email", "push", "in_app"]
 *                     recipients:
 *                       type: array
 *                       description: List of notification recipients
 *                       items:
 *                         type: object
 *                         properties:
 *                           recipientId:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           recipientRole:
 *                             type: string
 *                             example: "customer"
 *                           channel:
 *                             type: string
 *                             example: "email"
 *                           status:
 *                             type: string
 *                             example: "sent"
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the notification was sent
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     metadata:
 *                       type: object
 *                       example: {"template": "order_ready"}
 *                 message:
 *                   type: string
 *                   example: "Notification sent successfully"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to send notifications
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
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// Check if user has permission to send notifications
    if (!user.roles?.some(role => ['admin', 'staff', 'chef'].includes(role))) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/notify/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const body: SendNotificationRequest = await request.json();
    const { notificationType, message, priority, channels, metadata } = body;

    if (!notificationType || !priority || !channels || channels.length === 0) {
      return ResponseFactory.validationError('Missing required fields: notificationType, priority, and channels.');
    }

    const convex = getConvexClientFromRequest(request);

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to send notifications for this specific order
    if (user.roles?.includes('chef') && order.chef_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only send notifications for your own orders.');
    }

    // Send notification
    const notificationResult = await convex.mutation(api.mutations.orders.sendOrderNotification, {
      orderId: order._id,
      sentBy: userId || '',
      notificationType,
      message: message || getDefaultMessage(notificationType, order),
      priority,
      channels,
      metadata: {
        sentByRole: user.roles?.[0] || 'unknown',
        orderStatus: order.order_status,
        ...metadata
      }
    });

    logger.log(`Notification sent for order ${order_id} by ${userId} (${user.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      notification: notificationResult ? {
        id: notificationResult._id,
        type: notificationType,
        message: message || getDefaultMessage(notificationType, order),
        priority,
        channels,
        sentBy: userId,
        sentByRole: user.roles?.[0] || 'unknown',
        sentAt: new Date().toISOString(),
        metadata: metadata || {}
      } : null,
      message: 'Notification sent successfully.'
    });

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Send notification error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to send notification.'));
  }
}

function getDefaultMessage(notificationType: string, order: any): string {
  const orderId = order.order_id;
  
  switch (notificationType) {
    case 'order_confirmed':
      return `Your order ${orderId} has been confirmed and is being prepared!`;
    case 'order_preparing':
      return `Your order ${orderId} is now being prepared in the kitchen.`;
    case 'order_ready':
      return `Your order ${orderId} is ready for pickup/delivery!`;
    case 'order_delivered':
      return `Your order ${orderId} has been delivered. Enjoy your meal!`;
    case 'order_completed':
      return `Your order ${orderId} has been completed. Thank you for choosing CribNosh!`;
    case 'order_cancelled':
      return `Your order ${orderId} has been cancelled.`;
    case 'order_updated':
      return `Your order ${orderId} has been updated.`;
    default:
      return `Update regarding your order ${orderId}.`;
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 