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
 * /driver/orders/{id}:
 *   get:
 *     summary: Get Driver Order Details
 *     description: Get detailed information about a specific order assigned to the driver
 *     tags: [Driver]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                     order:
 *                       type: object
 *                       description: Order details
 *                     assignment:
 *                       type: object
 *                       description: Delivery assignment details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can access this endpoint
 *       404:
 *         description: Order or assignment not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(
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

    // Get order by ID (using order_id field)
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
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

    // Combine order and assignment details
    const orderWithAssignment = {
      ...order,
      assignment: {
        _id: assignment._id,
        status: assignment.status,
        assigned_at: assignment.assigned_at,
        estimated_pickup_time: assignment.estimated_pickup_time,
        estimated_delivery_time: assignment.estimated_delivery_time,
        actual_pickup_time: assignment.actual_pickup_time,
        actual_delivery_time: assignment.actual_delivery_time,
        pickup_location: assignment.pickup_location,
        delivery_location: assignment.delivery_location,
        delivery_notes: assignment.delivery_notes,
        customer_rating: assignment.customer_rating,
        customer_feedback: assignment.customer_feedback,
      },
    };

    return ResponseFactory.success({
      order: orderWithAssignment,
      assignment: orderWithAssignment.assignment,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch driver order details.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

