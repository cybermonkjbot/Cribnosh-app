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
 * /driver/orders/{id}/accept:
 *   post:
 *     summary: Accept Order Assignment
 *     description: Accept a delivery assignment for the current driver
 *     tags: [Driver]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to accept
 *     responses:
 *       200:
 *         description: Order accepted successfully
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
 *         description: Forbidden - only drivers can accept orders
 *       404:
 *         description: Order or assignment not found
 *       400:
 *         description: Bad request - order cannot be accepted
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const orderId = params.id;

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

    // Accept the order via Convex mutation
    const updatedAssignment = await convex.mutation(api.mutations.drivers.acceptOrder, {
      assignmentId: assignment._id,
      driverId: driver._id,
    });

    return ResponseFactory.success({
      assignment: updatedAssignment,
      message: 'Order accepted successfully',
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept order.';
    if (errorMessage.includes('Cannot accept')) {
      return ResponseFactory.validationError(errorMessage);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to accept order.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

