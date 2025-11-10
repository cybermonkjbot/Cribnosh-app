import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

interface BulkRefundEligibilityRequest {
  orders: Array<{
    orderId: string;
    action: 'mark_non_refundable' | 'mark_refundable' | 'extend_window';
    reason: string;
    description: string;
    newWindowHours?: number; // For extend_window action
    effectiveImmediately?: boolean; // For mark_non_refundable action
    metadata?: Record<string, string>;
  }>;
  globalReason?: string; // Applied to all orders if not specified individually
  globalDescription?: string; // Applied to all orders if not specified individually
}

/**
 * @swagger
 * /admin/orders/bulk-refund-eligibility:
 *   post:
 *     summary: Bulk Refund Eligibility Management
 *     description: Manage refund eligibility for multiple orders in bulk (admin only)
 *     tags: [Admin, Orders, Refunds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orders
 *             properties:
 *               orders:
 *                 type: array
 *                 description: Array of order refund eligibility operations
 *                 items:
 *                   type: object
 *                   required:
 *                     - orderId
 *                     - action
 *                     - reason
 *                     - description
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Order ID to modify
 *                       example: "j1234567890abcdef"
 *                     action:
 *                       type: string
 *                       enum: [mark_non_refundable, mark_refundable, extend_window]
 *                       description: Action to perform on the order
 *                       example: "mark_non_refundable"
 *                     reason:
 *                       type: string
 *                       description: Reason for the action
 *                       example: "Customer request"
 *                     description:
 *                       type: string
 *                       description: Detailed description of the action
 *                       example: "Customer requested immediate refund ineligibility"
 *                     newWindowHours:
 *                       type: number
 *                       nullable: true
 *                       description: New refund window in hours (for extend_window action)
 *                       example: 48
 *                     effectiveImmediately:
 *                       type: boolean
 *                       nullable: true
 *                       description: Whether to apply immediately (for mark_non_refundable action)
 *                       example: true
 *                     metadata:
 *                       type: object
 *                       nullable: true
 *                       description: Additional metadata for the operation
 *                       example: {"adminNote": "Special case handling"}
 *               globalReason:
 *                 type: string
 *                 nullable: true
 *                 description: Global reason applied to all orders if not specified individually
 *                 example: "Bulk admin operation"
 *               globalDescription:
 *                 type: string
 *                 nullable: true
 *                 description: Global description applied to all orders if not specified individually
 *                 example: "Bulk refund eligibility update"
 *     responses:
 *       200:
 *         description: Bulk refund eligibility operation completed
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
 *                     results:
 *                       type: object
 *                       properties:
 *                         successful:
 *                           type: array
 *                           description: Successfully processed orders
 *                           items:
 *                             type: object
 *                             properties:
 *                               orderId:
 *                                 type: string
 *                                 example: "j1234567890abcdef"
 *                               action:
 *                                 type: string
 *                                 example: "mark_non_refundable"
 *                               orderStatus:
 *                                 type: string
 *                                 example: "completed"
 *                               isRefundable:
 *                                 type: boolean
 *                                 example: false
 *                               processedAt:
 *                                 type: number
 *                                 example: 1640995200000
 *                         failed:
 *                           type: array
 *                           description: Failed operations
 *                           items:
 *                             type: object
 *                             properties:
 *                               orderId:
 *                                 type: string
 *                                 example: "j1234567890abcdef"
 *                               error:
 *                                 type: string
 *                                 example: "Order not found"
 *                               action:
 *                                 type: string
 *                                 example: "mark_refundable"
 *                         summary:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                               example: 10
 *                             successful:
 *                               type: number
 *                               example: 8
 *                             failed:
 *                               type: number
 *                               example: 2
 *                     message:
 *                       type: string
 *                       example: "Bulk operation completed: 8 successful, 2 failed"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - invalid request body
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
 *         description: Forbidden - admin access required
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
    // Get authenticated admin from session token
    const { userId } = await getAuthenticatedAdmin(request);

    const body: BulkRefundEligibilityRequest = await request.json();
    const { orders, globalReason, globalDescription } = body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return ResponseFactory.validationError('Missing or invalid orders array. Must contain at least one order.');
    }

    if (orders.length > 50) {
      return ResponseFactory.validationError('Too many orders. Maximum 50 orders per request.');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    interface RefundOperationResult {
      orderId: string;
      success: boolean;
      error?: string;
      action: string;
    }

    const results = {
      successful: [] as RefundOperationResult[],
      failed: [] as RefundOperationResult[],
      summary: {
        total: orders.length,
        successful: 0,
        failed: 0
      }
    };

    // Process each order
    for (const orderRequest of orders) {
      try {
        const { orderId, action, reason, description, newWindowHours = 24, effectiveImmediately = false, metadata } = orderRequest;
        
        // Use global values if not specified
        const finalReason = reason || globalReason || 'admin_override';
        const finalDescription = description || globalDescription || 'Bulk admin operation';

        // Get order details
        const order = await convex.query(api.queries.orders.getOrderById, {
          orderId,
          sessionToken: sessionToken || undefined
        });
        if (!order) {
          results.failed.push({
            orderId,
            error: 'Order not found',
            action,
            success: false
          });
          continue;
        }

        // Validate order status based on action
        if (['completed', 'cancelled'].includes(order.order_status)) {
          if (action === 'mark_refundable') {
            results.failed.push({
              orderId,
              error: `Order cannot be made refundable due to status: ${order.order_status}`,
              action,
              success: false
            });
            continue;
          }
        }

        const now = Date.now();

        // Perform the requested action
        switch (action) {
          case 'mark_non_refundable':
            // Check if already non-refundable
            if (order.is_refundable === false) {
              results.failed.push({
                orderId,
                error: 'Order is already marked as non-refundable',
                action,
                success: false
              });
              continue;
            }

            // Check 24-hour window unless admin override
            if (!effectiveImmediately && order.delivered_at && order.refund_eligible_until && now <= order.refund_eligible_until) {
              results.failed.push({
                orderId,
                error: 'Order is still within the 24-hour refund window. Use effectiveImmediately=true to override.',
                action,
                success: false
              });
              continue;
            }

            await convex.mutation(api.mutations.orders.updateRefundEligibility, {
              orderId: order._id,
              updatedBy: userId,
              reason: `Bulk admin override: ${finalDescription}`,
              metadata: {
                adminReason: finalReason,
                adminDescription: finalDescription,
                effectiveImmediately,
                adminUserId: userId,
                adminOverride: true,
                bulkOperation: true,
                originalRefundEligibleUntil: order.refund_eligible_until,
                originalIsRefundable: order.is_refundable,
                ...metadata
              },
              sessionToken: sessionToken || undefined
            });
            break;

          case 'mark_refundable':
            // Check if already refundable
            if (order.is_refundable === true) {
              results.failed.push({
                orderId,
                error: 'Order is already marked as refundable',
                action,
                success: false
              });
              continue;
            }

            await convex.mutation(api.mutations.orders.updateRefundEligibility, {
              orderId: order._id,
              updatedBy: userId,
              reason: `Bulk admin override: ${finalDescription}`,
              metadata: {
                adminReason: finalReason,
                adminDescription: finalDescription,
                adminUserId: userId,
                adminOverride: true,
                bulkOperation: true,
                originalRefundEligibleUntil: order.refund_eligible_until,
                originalIsRefundable: order.is_refundable,
                ...metadata
              },
              sessionToken: sessionToken || undefined
            });
            break;

          case 'extend_window':
            if (!order.delivered_at) {
              results.failed.push({
                orderId,
                error: 'Cannot extend window for undelivered order',
                action,
                success: false
              });
              continue;
            }

            const newRefundEligibleUntil = now + (newWindowHours * 60 * 60 * 1000);
            await convex.mutation(api.mutations.orders.updateRefundWindow, {
              orderId: order._id,
              updatedBy: userId,
              newRefundEligibleUntil,
              reason: `Bulk admin window extension: ${finalDescription}`,
              metadata: {
                adminReason: finalReason,
                adminDescription: finalDescription,
                newWindowHours,
                adminUserId: userId,
                adminOverride: true,
                bulkOperation: true,
                originalRefundEligibleUntil: order.refund_eligible_until,
                ...metadata
              },
              sessionToken: sessionToken || undefined
            });
            break;

          default:
            results.failed.push({
              orderId,
              error: `Invalid action: ${action}`,
              action,
              success: false
            });
            continue;
        }

        // Success
        results.successful.push({
          orderId,
          action,
          success: true
        });

      } catch (error: unknown) {
        results.failed.push({
          orderId: orderRequest.orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
          action: orderRequest.action,
          success: false
        });
      }
    }

    // Update summary
    results.summary.successful = results.successful.length;
    results.summary.failed = results.failed.length;

    logger.log(`Bulk refund eligibility operation completed by admin ${userId}: ${results.summary.successful} successful, ${results.summary.failed} failed`);

    return ResponseFactory.success({
      success: true,
      results,
      message: `Bulk operation completed: ${results.summary.successful} successful, ${results.summary.failed} failed`
    });

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Bulk refund eligibility error:', error);
    return ResponseFactory.internalError(error instanceof Error ? error.message : 'Failed to process bulk refund eligibility operation.' 
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 