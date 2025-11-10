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
 * /driver/earnings/advanced:
 *   get:
 *     summary: Get Advanced Driver Earnings
 *     description: Get detailed earnings breakdown including tips, bonuses, incentives, goals, and performance metrics
 *     tags: [Driver]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *         description: Time period for earnings
 *         default: 30d
 *     responses:
 *       200:
 *         description: Advanced earnings retrieved successfully
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
 *                     total_earnings:
 *                       type: number
 *                       description: Total earnings in the period
 *                     weekly_earnings:
 *                       type: number
 *                       description: Weekly earnings
 *                     monthly_earnings:
 *                       type: number
 *                       description: Monthly earnings
 *                     earnings_breakdown:
 *                       type: object
 *                       properties:
 *                         base_earnings:
 *                           type: number
 *                           description: Base delivery earnings
 *                         tips:
 *                           type: number
 *                           description: Tips received
 *                         bonuses:
 *                           type: number
 *                           description: Bonuses earned
 *                         incentives:
 *                           type: number
 *                           description: Incentives earned
 *                     earnings_trend:
 *                       type: number
 *                       description: Earnings trend percentage (positive or negative)
 *                     goals:
 *                       type: object
 *                       properties:
 *                         weekly_target:
 *                           type: number
 *                           description: Weekly earnings target
 *                         monthly_target:
 *                           type: number
 *                           description: Monthly earnings target
 *                         weekly_progress:
 *                           type: number
 *                           description: Weekly progress percentage
 *                         monthly_progress:
 *                           type: number
 *                           description: Monthly progress percentage
 *                     performance:
 *                       type: object
 *                       properties:
 *                         average_order_value:
 *                           type: number
 *                           description: Average order value
 *                         orders_completed:
 *                           type: number
 *                           description: Number of orders completed
 *                         average_rating:
 *                           type: number
 *                           description: Average customer rating
 *                         completion_rate:
 *                           type: number
 *                           description: Order completion rate percentage
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range based on period
    const now = Date.now();
    let startDate: number;
    switch (period) {
      case '7d':
        startDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = 0; // All time
        break;
      default:
        startDate = now - (30 * 24 * 60 * 60 * 1000);
    }

    // Get earnings data
    const earnings = await convex.query(api.queries.drivers.getEarningsByDriver, {
      driverId: driver._id,
      startDate: startDate > 0 ? startDate : undefined,
      endDate: now,
      sessionToken: sessionToken || undefined,
    });

    // Get all assignments for performance metrics
    const assignments = await convex.query(api.queries.drivers.getOrdersByDriver, {
      driverId: driver._id,
      sessionToken: sessionToken || undefined,
    });

    // Filter assignments by date range
    const periodAssignments = (assignments || []).filter((order: any) => {
      const assignment = order.assignment;
      const assignedAt = assignment?.assigned_at || order._creationTime || order.createdAt || 0;
      return assignedAt >= startDate && assignedAt <= now;
    });

    // Calculate earnings breakdown
    let baseEarnings = 0;
    let tips = 0;
    let bonuses = 0;
    let incentives = 0;

    const completedAssignments = periodAssignments.filter((order: any) => {
      const status = order.assignment?.status || order.order_status || order.status;
      return status === 'delivered';
    });

    for (const order of completedAssignments) {
      const orderTotal = order.total_amount || 0;
      const driverEarnings = Math.max(orderTotal * 0.1, 5); // Base earnings calculation
      baseEarnings += driverEarnings;

      // Extract tips, bonuses, and incentives from order metadata or assignment
      const assignment = order.assignment;
      if (assignment?.metadata) {
        tips += assignment.metadata.tips || 0;
        bonuses += assignment.metadata.bonuses || 0;
        incentives += assignment.metadata.incentives || 0;
      }
    }

    // Calculate weekly and monthly earnings
    const weeklyEarnings = Object.values(earnings?.weeklyEarnings || {}).reduce((sum: number, val: any) => sum + val, 0);
    const monthlyEarnings = Object.values(earnings?.monthlyEarnings || {}).reduce((sum: number, val: any) => sum + val, 0);

    // Calculate earnings trend (compare current period with previous period)
    const previousStartDate = startDate - (now - startDate);
    const previousEarnings = await convex.query(api.queries.drivers.getEarningsByDriver, {
      driverId: driver._id,
      startDate: previousStartDate > 0 ? previousStartDate : undefined,
      endDate: startDate,
      sessionToken: sessionToken || undefined,
    });

    const currentTotal = earnings?.totalEarnings || 0;
    const previousTotal = previousEarnings?.totalEarnings || 0;
    const earningsTrend = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    // Calculate performance metrics
    const ordersCompleted = completedAssignments.length;
    const totalOrders = periodAssignments.length;
    const completionRate = totalOrders > 0 ? (ordersCompleted / totalOrders) * 100 : 0;

    // Calculate average order value
    const totalOrderValue = completedAssignments.reduce((sum: number, order: any) => {
      return sum + (order.total_amount || 0);
    }, 0);
    const averageOrderValue = ordersCompleted > 0 ? totalOrderValue / ordersCompleted : 0;

    // Calculate average rating
    const ratings: number[] = [];
    completedAssignments.forEach((order: any) => {
      const assignment = order.assignment;
      if (assignment?.customer_rating) {
        ratings.push(assignment.customer_rating);
      }
    });
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

    // Calculate goals (placeholder - would need goal data from driver profile or settings)
    const weeklyTarget = driver.weeklyEarningsTarget || 1000; // Default target
    const monthlyTarget = driver.monthlyEarningsTarget || 4000; // Default target
    const weeklyProgress = weeklyTarget > 0 ? (weeklyEarnings / weeklyTarget) * 100 : 0;
    const monthlyProgress = monthlyTarget > 0 ? (monthlyEarnings / monthlyTarget) * 100 : 0;

    return ResponseFactory.success({
      total_earnings: currentTotal,
      weekly_earnings: weeklyEarnings,
      monthly_earnings: monthlyEarnings,
      earnings_breakdown: {
        base_earnings: baseEarnings,
        tips,
        bonuses,
        incentives,
      },
      earnings_trend: Math.round(earningsTrend * 100) / 100,
      goals: {
        weekly_target: weeklyTarget,
        monthly_target: monthlyTarget,
        weekly_progress: Math.round(weeklyProgress * 100) / 100,
        monthly_progress: Math.round(monthlyProgress * 100) / 100,
      },
      performance: {
        average_order_value: Math.round(averageOrderValue * 100) / 100,
        orders_completed: ordersCompleted,
        average_rating: Math.round(averageRating * 10) / 10,
        completion_rate: Math.round(completionRate * 100) / 100,
      },
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch advanced earnings.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

