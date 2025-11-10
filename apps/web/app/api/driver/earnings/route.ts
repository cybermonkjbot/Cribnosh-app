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
 * /driver/earnings:
 *   get:
 *     summary: Get Driver Earnings
 *     description: Get earnings for the current driver with optional date range
 *     tags: [Driver]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: integer
 *         description: Start date timestamp (Unix timestamp in milliseconds)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: integer
 *         description: End date timestamp (Unix timestamp in milliseconds)
 *     responses:
 *       200:
 *         description: Earnings retrieved successfully
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
 *                     earnings:
 *                       type: object
 *                       properties:
 *                         totalEarnings:
 *                           type: number
 *                           description: Total earnings in the period
 *                         completedDeliveries:
 *                           type: number
 *                           description: Number of completed deliveries
 *                         dailyEarnings:
 *                           type: object
 *                           description: Earnings grouped by day
 *                         weeklyEarnings:
 *                           type: object
 *                           description: Earnings grouped by week
 *                         monthlyEarnings:
 *                           type: object
 *                           description: Earnings grouped by month
 *                         period:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: number
 *                             endDate:
 *                               type: number
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

    // Get driver profile by user email
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? parseInt(startDateParam) : undefined;
    const endDate = endDateParam ? parseInt(endDateParam) : undefined;

    // Fetch earnings
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const earnings = await convex.query(api.queries.drivers.getEarningsByDriver, {
      driverId: driver._id,
      startDate,
      endDate,
      sessionToken: sessionToken || undefined,
    });

    return ResponseFactory.success({
      earnings: {
        totalEarnings: earnings?.totalEarnings || 0,
        completedDeliveries: earnings?.completedDeliveries || 0,
        dailyEarnings: earnings?.dailyEarnings || {},
        weeklyEarnings: earnings?.weeklyEarnings || {},
        monthlyEarnings: earnings?.monthlyEarnings || {},
        period: earnings?.period || {
          startDate: startDate || Date.now() - (30 * 24 * 60 * 60 * 1000),
          endDate: endDate || Date.now(),
        },
      },
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch driver earnings.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

