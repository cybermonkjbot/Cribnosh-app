import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

interface SendMessageRequest {
  message: string;
  messageType: 'text' | 'image' | 'file' | 'status_update';
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/{order_id}/messages:
 *   post:
 *     summary: Send Order Message
 *     description: Send a message related to a specific order (customer, chef, staff communication)
 *     tags: [Orders, Order Management, Messaging]
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
 *               - message
 *               - messageType
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: "The order will be ready in 15 minutes"
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file, status_update]
 *                 description: Type of message
 *                 example: "text"
 *               metadata:
 *                 type: object
 *                 description: Additional message metadata
 *                 example: {"priority": "normal", "attachments": []}
 *     responses:
 *       200:
 *         description: Message sent successfully
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
 *                     messageId:
 *                       type: string
 *                       description: Generated message ID
 *                       example: "MSG-12345"
 *                     orderId:
 *                       type: string
 *                       example: "ORD-12345"
 *                     senderId:
 *                       type: string
 *                       description: ID of the message sender
 *                       example: "j1234567890abcdef"
 *                     senderRole:
 *                       type: string
 *                       description: Role of the message sender
 *                       example: "chef"
 *                     message:
 *                       type: string
 *                       example: "The order will be ready in 15 minutes"
 *                     messageType:
 *                       type: string
 *                       example: "text"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: When the message was sent
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     metadata:
 *                       type: object
 *                       example: {"priority": "normal"}
 *                 message:
 *                   type: string
 *                   example: "Message sent successfully"
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
 *         description: Forbidden - insufficient permissions to send messages for this order
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
    const { userId, user } = await getAuthenticatedUser(request);
    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/messages/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const { message, messageType, metadata } = await request.json() as SendMessageRequest;

    if (!message || !messageType) {
      return ResponseFactory.validationError('Missing required fields: message, messageType');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, {
      orderId: order_id,
      sessionToken: sessionToken || undefined
    });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to send messages for this specific order
    if (user.roles?.includes('customer') && order.customer_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only send messages for your own orders.');
    }
    if (user.roles?.includes('chef') && order.chef_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only send messages for your own orders.');
    }

    // Check if order can have messages sent (not completed or cancelled)
    if (['completed', 'cancelled'].includes(order.order_status)) {
      return ResponseFactory.validationError('Messages cannot be sent. Current status: ${order.order_status}.');
    }

    // Send message
    const messageResult = await convex.mutation(api.mutations.orders.sendOrderMessage, {
      orderId: order._id,
      message,
      messageType,
      sentBy: userId || '',
      metadata: {
        sentByRole: user.roles?.[0] || 'unknown',
        orderStatus: order.order_status,
        ...metadata
      },
      sessionToken: sessionToken || undefined
    });

    logger.log(`Message sent for order ${order_id} by ${userId} (${user.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      message: messageResult ? {
        id: messageResult._id,
        message,
        messageType,
        sentBy: userId,
        sentByRole: user.roles?.[0] || 'unknown',
        sentAt: new Date().toISOString(),
        metadata: metadata || {}
      } : null,
      messageText: 'Message sent successfully.'
    });

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Send message error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to send message.'));
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/messages/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, {
      orderId: order_id,
      sessionToken: sessionToken || undefined
    });
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

    // Get order messages
    const messages = await convex.query(api.queries.orders.getOrderMessages, {
      orderId: order_id,
      sessionToken: sessionToken || undefined
    });

    // Format messages
    const formattedMessages = messages.map((msg: { _id: string; message?: string; messageType?: string; sent_by?: string; sent_at?: number; metadata?: Record<string, unknown> }) => ({
      id: msg._id,
      message: msg.message,
      messageType: msg.messageType,
      sentBy: msg.sent_by,
      sentAt: new Date(msg.sent_at || 0).toISOString(),
      metadata: msg.metadata || {}
    }));

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      messages: formattedMessages,
      totalMessages: formattedMessages.length
    });

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Get order messages error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get order messages.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 