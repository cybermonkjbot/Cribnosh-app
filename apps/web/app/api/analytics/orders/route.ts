import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /analytics/orders:
 *   get:
 *     summary: Get Order Analytics
 *     description: Get comprehensive order analytics with filtering and grouping options (admin/staff only)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date filter (timestamp)
 *         example: "1640995200000"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date filter (timestamp)
 *         example: "1641081600000"
 *       - in: query
 *         name: chefId
 *         schema:
 *           type: string
 *         description: Filter by specific chef ID
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by specific customer ID
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *         example: "completed"
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, chef, status]
 *           default: day
 *         description: Group analytics by time period or category
 *         example: "day"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of results to return
 *         example: 100
 *     responses:
 *       200:
 *         description: Order analytics retrieved successfully
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
 *                     analytics:
 *                       type: object
 *                       description: Analytics data grouped by specified criteria
 *                       properties:
 *                         totalOrders:
 *                           type: number
 *                           description: Total number of orders
 *                           example: 1250
 *                         totalRevenue:
 *                           type: number
 *                           description: Total revenue
 *                           example: 45678.50
 *                         averageOrderValue:
 *                           type: number
 *                           description: Average order value
 *                           example: 36.54
 *                         dataPoints:
 *                           type: array
 *                           description: Data points based on grouping
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                                 description: Time period or category
 *                                 example: "2024-01-15"
 *                               orders:
 *                                 type: number
 *                                 description: Number of orders
 *                                 example: 45
 *                               revenue:
 *                                 type: number
 *                                 description: Revenue for period
 *                                 example: 1643.25
 *                               chefId:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Chef ID (if grouped by chef)
 *                                 example: "j1234567890abcdef"
 *                               status:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Order status (if grouped by status)
 *                                 example: "completed"
 *                     filters:
 *                       type: object
 *                       description: Applied filters
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           nullable: true
 *                           example: "1640995200000"
 *                         endDate:
 *                           type: string
 *                           nullable: true
 *                           example: "1641081600000"
 *                         chefId:
 *                           type: string
 *                           nullable: true
 *                           example: "j1234567890abcdef"
 *                         customerId:
 *                           type: string
 *                           nullable: true
 *                           example: "j1234567890abcdef"
 *                         status:
 *                           type: string
 *                           nullable: true
 *                           example: "completed"
 *                         groupBy:
 *                           type: string
 *                           example: "day"
 *                         limit:
 *                           type: number
 *                           example: 100
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Analytics generation timestamp
 *                       example: "2024-01-15T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions (admin/staff only)
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    await getAuthenticatedUser(request);// Check if user has permission to access analytics
    if (!['admin', 'staff'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const chefId = searchParams.get('chefId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month, chef, status
    const limit = parseInt(searchParams.get('limit') || '100');

    const convex = getConvexClient();

    // Get order analytics based on filters
    const analytics = await convex.query(api.queries.analytics.getOrderAnalytics, {
      startDate: startDate ? parseInt(startDate) : undefined,
      endDate: endDate ? parseInt(endDate) : undefined,
      chefId: chefId ? (chefId as any) : undefined,
      customerId: customerId ? (customerId as any) : undefined,
      status: status || undefined,
      groupBy: (groupBy === 'day' || groupBy === 'week' || groupBy === 'month' || groupBy === 'chef' || groupBy === 'status') ? groupBy : 'day',
      limit
    });

    return ResponseFactory.success({
      success: true,
      analytics,
      filters: {
        startDate,
        endDate,
        chefId,
        customerId,
        status,
        groupBy,
        limit
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Get order analytics error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to get order analytics.' 
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 