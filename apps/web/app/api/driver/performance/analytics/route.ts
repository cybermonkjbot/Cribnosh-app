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
 * /driver/performance/analytics:
 *   get:
 *     summary: Get Driver Performance Analytics
 *     description: Get performance analytics for the current driver including efficiency, safety, and customer metrics
 *     tags: [Driver]
 *     parameters:
 *       - in: query
 *         name: metricType
 *         schema:
 *           type: string
 *           enum: [efficiency, safety, customer]
 *         description: Type of metric to retrieve
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *         description: Time period for analytics
 *         default: 30d
 *     responses:
 *       200:
 *         description: Performance analytics retrieved successfully
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
 *                     score:
 *                       type: number
 *                       description: Overall performance score
 *                     trend:
 *                       type: number
 *                       description: Trend percentage (positive or negative)
 *                     ordersCompleted:
 *                       type: number
 *                       description: Number of orders completed
 *                     averageRating:
 *                       type: number
 *                       description: Average customer rating
 *                     completionRate:
 *                       type: number
 *                       description: Order completion rate percentage
 *                     onTimeDeliveryRate:
 *                       type: number
 *                       description: On-time delivery rate percentage
 *                     customerFeedbackCount:
 *                       type: number
 *                       description: Number of customer feedback entries
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
    const metricType = searchParams.get('metricType') as 'efficiency' | 'safety' | 'customer' | null;
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
      default:
        startDate = now - (30 * 24 * 60 * 60 * 1000);
    }

    // Get all assignments for this driver in the period
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

    // Calculate metrics based on metricType
    let analytics: any = {
      score: 0,
      trend: 0,
      ordersCompleted: 0,
      averageRating: 0,
      completionRate: 0,
      onTimeDeliveryRate: 0,
      customerFeedbackCount: 0,
    };

    if (metricType === 'efficiency' || !metricType) {
      // Efficiency metrics
      const completed = periodAssignments.filter((order: any) => {
        const status = order.assignment?.status || order.order_status || order.status;
        return status === 'delivered';
      }).length;

      const total = periodAssignments.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Calculate average delivery time
      const completedWithTimes = periodAssignments.filter((order: any) => {
        const assignment = order.assignment;
        return assignment?.status === 'delivered' && assignment?.actual_pickup_time && assignment?.actual_delivery_time;
      });

      let avgDeliveryTime = 0;
      if (completedWithTimes.length > 0) {
        const totalTime = completedWithTimes.reduce((sum: number, order: any) => {
          const assignment = order.assignment;
          return sum + (assignment.actual_delivery_time - assignment.actual_pickup_time);
        }, 0);
        avgDeliveryTime = totalTime / completedWithTimes.length;
      }

      // Calculate on-time delivery rate (delivered within estimated time)
      const onTimeDeliveries = completedWithTimes.filter((order: any) => {
        const assignment = order.assignment;
        if (!assignment?.estimated_delivery_time || !assignment?.actual_delivery_time) return false;
        return assignment.actual_delivery_time <= assignment.estimated_delivery_time;
      }).length;

      const onTimeRate = completedWithTimes.length > 0 ? (onTimeDeliveries / completedWithTimes.length) * 100 : 0;

      // Calculate efficiency score (0-100)
      const completionScore = completionRate;
      const onTimeScore = onTimeRate;
      const timeScore = avgDeliveryTime > 0 ? Math.max(0, 100 - (avgDeliveryTime / (60 * 60 * 1000)) * 10) : 0; // Penalize longer delivery times
      const efficiencyScore = (completionScore * 0.4) + (onTimeScore * 0.4) + (timeScore * 0.2);

      analytics = {
        score: Math.round(efficiencyScore),
        trend: 0, // TODO: Calculate trend from previous period
        ordersCompleted: completed,
        completionRate: Math.round(completionRate),
        onTimeDeliveryRate: Math.round(onTimeRate),
        averageDeliveryTime: Math.round(avgDeliveryTime / (60 * 1000)), // in minutes
      };
    } else if (metricType === 'safety') {
      // Safety metrics (placeholder - would need safety-related data)
      const completed = periodAssignments.filter((order: any) => {
        const status = order.assignment?.status || order.order_status || order.status;
        return status === 'delivered';
      }).length;

      const failed = periodAssignments.filter((order: any) => {
        const status = order.assignment?.status || order.order_status || order.status;
        return status === 'failed';
      }).length;

      const safetyScore = completed > 0 ? ((completed - failed) / completed) * 100 : 0;

      analytics = {
        score: Math.round(safetyScore),
        trend: 0,
        ordersCompleted: completed,
        failedDeliveries: failed,
        safetyIncidents: 0, // TODO: Track safety incidents
      };
    } else if (metricType === 'customer') {
      // Customer metrics
      const completed = periodAssignments.filter((order: any) => {
        const status = order.assignment?.status || order.order_status || order.status;
        return status === 'delivered';
      }).length;

      // Calculate average rating from assignments
      const ratings: number[] = [];
      periodAssignments.forEach((order: any) => {
        const assignment = order.assignment;
        if (assignment?.customer_rating) {
          ratings.push(assignment.customer_rating);
        }
      });

      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

      const feedbackCount = periodAssignments.filter((order: any) => {
        const assignment = order.assignment;
        return assignment?.customer_feedback && assignment.customer_feedback.trim().length > 0;
      }).length;

      // Calculate customer satisfaction score
      const ratingScore = averageRating * 20; // Convert 0-5 rating to 0-100
      const feedbackScore = Math.min(100, (feedbackCount / completed) * 100); // More feedback = better
      const customerScore = (ratingScore * 0.7) + (feedbackScore * 0.3);

      analytics = {
        score: Math.round(customerScore),
        trend: 0,
        ordersCompleted: completed,
        averageRating: Math.round(averageRating * 10) / 10,
        customerFeedbackCount: feedbackCount,
      };
    }

    return ResponseFactory.success(analytics);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch performance analytics.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

