import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedDriver } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /driver/orders:
 *   get:
 *     summary: Get Driver Orders
 *     description: Get paginated list of orders assigned to the current driver
 *     tags: [Driver]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of orders to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of orders to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [assigned, accepted, picked_up, in_transit, delivered, failed, cancelled]
 *         description: Filter orders by assignment status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       description: Array of driver orders with assignment details
 *                     total:
 *                       type: number
 *                       description: Total number of orders
 *                     limit:
 *                       type: number
 *                     offset:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can access this endpoint
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
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

    // Pagination and filtering
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    // Get filter parameters
    const statusParam = searchParams.get('status') as
      | 'assigned'
      | 'accepted'
      | 'picked_up'
      | 'in_transit'
      | 'delivered'
      | 'failed'
      | 'cancelled'
      | null;

    // Fetch orders with filters
    const orders = await convex.query(api.queries.drivers.getOrdersByDriver, {
      driverId: driver._id,
      status: statusParam || undefined,
      limit,
      offset,
      sessionToken: sessionToken || undefined,
    });

    // Get total count for pagination (without pagination limit)
    const allOrders = await convex.query(api.queries.drivers.getOrdersByDriver, {
      driverId: driver._id,
      status: statusParam || undefined,
      sessionToken: sessionToken || undefined,
    });

    return ResponseFactory.success({
      orders: orders || [],
      total: allOrders?.length || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch driver orders.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

