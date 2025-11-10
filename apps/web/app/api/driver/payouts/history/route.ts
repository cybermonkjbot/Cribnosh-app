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
 * /driver/payouts/history:
 *   get:
 *     summary: Get Driver Payout History
 *     description: Get paginated list of payout requests and their statuses for the current driver
 *     tags: [Driver]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of payouts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of payouts to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter payouts by status
 *     responses:
 *       200:
 *         description: Payout history retrieved successfully
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
 *                     payouts:
 *                       type: array
 *                       description: Array of payout requests
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Payout request ID
 *                           amount:
 *                             type: number
 *                             description: Payout amount
 *                           status:
 *                             type: string
 *                             enum: [pending, processing, completed, failed, cancelled]
 *                             description: Payout status
 *                           requestedAt:
 *                             type: number
 *                             description: Request timestamp
 *                           processedAt:
 *                             type: number
 *                             nullable: true
 *                             description: Processing completion timestamp
 *                           bankDetails:
 *                             type: object
 *                             description: Bank account details
 *                     total:
 *                       type: number
 *                       description: Total number of payouts
 *                     limit:
 *                       type: number
 *                     offset:
 *                       type: number
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can access this endpoint
 *       404:
 *         description: Driver profile not found
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

    // Get driver profile
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    // Get pagination and filter parameters
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const statusParam = searchParams.get('status') as
      | 'pending'
      | 'processing'
      | 'completed'
      | 'failed'
      | 'cancelled'
      | null;

    // TODO: Implement actual payout history query when payoutRequests table is created
    // For now, return empty array as placeholder
    // In a full implementation, you would query a payoutRequests table:
    // const payouts = await convex.query(api.queries.drivers.getPayoutHistory, {
    //   driverId: driver._id,
    //   status: statusParam || undefined,
    //   limit,
    //   offset,
    //   sessionToken: sessionToken || undefined,
    // });

    const payouts: any[] = [];

    // Filter by status if provided
    const filteredPayouts = statusParam
      ? payouts.filter((payout) => payout.status === statusParam)
      : payouts;

    // Apply pagination
    const paginatedPayouts = filteredPayouts.slice(offset, offset + limit);

    return ResponseFactory.success({
      payouts: paginatedPayouts,
      total: filteredPayouts.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch payout history.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

