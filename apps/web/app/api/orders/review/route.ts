import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /orders/review:
 *   post:
 *     summary: Mark Order as Reviewed
 *     description: Mark an order as reviewed by customers, chefs, staff, or admins. This endpoint allows different user roles to review completed orders and add review notes for tracking and quality assurance purposes.
 *     tags: [Orders, Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID of the order to mark as reviewed
 *                 example: "j1234567890abcdef"
 *               reviewNotes:
 *                 type: string
 *                 nullable: true
 *                 description: Optional notes about the order review
 *                 example: "Order completed successfully, customer satisfied"
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional metadata for the review
 *                 example:
 *                   reviewType: "quality_check"
 *                   reviewerComments: "Excellent food quality"
 *     responses:
 *       200:
 *         description: Order marked as reviewed successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Order ID
 *                           example: "j1234567890abcdef"
 *                         reviewedAt:
 *                           type: number
 *                           description: Timestamp when order was reviewed
 *                           example: 1705324800000
 *                     message:
 *                       type: string
 *                       example: "Order reviewed successfully."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing orderId or invalid order status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions or order ownership
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
 *       422:
 *         description: Unprocessable entity - order cannot be reviewed in current status
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

interface ReviewOrderRequest {
  orderId: string;
  reviewNotes?: string;
  metadata?: Record<string, string>;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    // Check if user has permission to mark orders as reviewed
    if (!user.roles?.some((role: string) => ['admin', 'staff', 'chef', 'customer'].includes(role))) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: ReviewOrderRequest = await request.json();
    const { orderId, reviewNotes, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClientFromRequest(request);

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to review this specific order
    if (user.roles?.includes('customer') && order.customer_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only review your own orders.');
    }

    // Check if order can be reviewed
    if (!['delivered', 'completed'].includes(order.order_status)) {
      return ResponseFactory.validationError('Order cannot be reviewed. Current status: ${order.order_status}. Order must be delivered first.');
    }

    // Mark order as reviewed
    const reviewedOrder = await convex.mutation(api.mutations.orders.markOrderReviewed, {
      orderId: order._id,
      reviewedBy: userId || '',
      reviewNotes: reviewNotes || 'Order reviewed',
      metadata: {
        reviewedByRole: user.roles?.[0] || 'unknown',
        ...metadata
      }
    });

    logger.log(`Order ${orderId} marked as reviewed by ${userId} (${user.roles?.join(',') || 'unknown'})`);

    return ResponseFactory.success({
      success: true,
      order: {
        id: order._id,
        reviewedAt: Date.now()
      },
      message: 'Order reviewed successfully.'
    });

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Order review error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to mark order as reviewed.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 