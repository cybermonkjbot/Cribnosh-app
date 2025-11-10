import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedDriver } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /orders/{order_id}/status:
 *   post:
 *     summary: Update Order/Delivery Status
 *     description: Update the delivery status of an order (picked_up, in_transit, delivered). Only drivers can update status.
 *     tags: [Driver, Orders]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [picked_up, in_transit, delivered]
 *                 description: New delivery status
 *               location:
 *                 type: object
 *                 description: Current driver location
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status update
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                     assignment:
 *                       type: object
 *                       description: Updated assignment details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can update order status
 *       404:
 *         description: Order or assignment not found
 *       400:
 *         description: Bad request - invalid status or order cannot be updated
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { order_id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedDriver(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get driver profile by user email
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    const orderId = params.order_id;
    const body = await request.json();
    const { status, location, notes } = body;

    // Validate status
    if (!status || !['picked_up', 'in_transit', 'delivered'].includes(status)) {
      return ResponseFactory.validationError('Invalid status. Must be one of: picked_up, in_transit, delivered');
    }

    // Get order by ID
    const order = await convex.query(api.queries.orders.getOrderById, {
      orderId,
      sessionToken: sessionToken || undefined,
    });

    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Get delivery assignment for this order
    const assignment = await convex.query(api.queries.delivery.getDeliveryAssignmentByOrder, {
      orderId,
    });

    if (!assignment) {
      return ResponseFactory.notFound('Order assignment not found.');
    }

    // Verify assignment belongs to this driver
    if (assignment.driver_id !== driver._id) {
      return ResponseFactory.notFound('Order assignment does not belong to this driver.');
    }

    // Update order status via Convex mutation
    const updatedAssignment = await convex.mutation(api.mutations.drivers.updateOrderStatus, {
      assignmentId: assignment._id,
      driverId: driver._id,
      status,
      location,
      notes,
    });

    return ResponseFactory.success({
      assignment: updatedAssignment,
      message: 'Order status updated successfully',
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order status.';
    if (errorMessage.includes('does not own') || errorMessage.includes('not found')) {
      return ResponseFactory.validationError(errorMessage);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update order status.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

