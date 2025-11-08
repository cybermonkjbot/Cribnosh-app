import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';

interface UserGrowthData {
  date: string;
  total_users: number;
  new_users: number;
}

/**
 * @swagger
 * /admin/analytics/users:
 *   get:
 *     summary: Get User Analytics
 *     description: Retrieve comprehensive user analytics data (admin only)
 *     tags: [Admin, Analytics, User Management]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: number
 *         description: Start timestamp for date range filter
 *         example: 1640995200000
 *       - in: query
 *         name: end
 *         schema:
 *           type: number
 *         description: End timestamp for date range filter
 *         example: 1641081600000
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
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
 *                     total_users:
 *                       type: number
 *                       description: Total number of users
 *                       example: 1250
 *                     customers:
 *                       type: number
 *                       description: Number of customer users
 *                       example: 1100
 *                     chefs:
 *                       type: number
 *                       description: Number of chef users
 *                       example: 120
 *                     admins:
 *                       type: number
 *                       description: Number of admin users
 *                       example: 5
 *                     staff:
 *                       type: number
 *                       description: Number of staff users
 *                       example: 25
 *                     active_users:
 *                       type: number
 *                       description: Number of active users
 *                       example: 1180
 *                     user_growth:
 *                       type: array
 *                       description: Daily user growth data
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-15"
 *                           total_users:
 *                             type: number
 *                             example: 1250
 *                           new_users:
 *                             type: number
 *                             example: 15
 *                     user_distribution:
 *                       type: object
 *                       description: User distribution by role
 *                       example:
 *                         customer: 88.0
 *                         chef: 9.6
 *                         staff: 2.0
 *                         admin: 0.4
 *                     period:
 *                       type: string
 *                       description: Analysis period
 *                       example: "2024-01-01T00:00:00.000Z - 2024-01-31T23:59:59.999Z"
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
 *         description: Forbidden - only admins can access this endpoint
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
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    
    const convex = getConvexClientFromRequest(request);
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ? Number(searchParams.get('start')) : undefined;
    const end = searchParams.get('end') ? Number(searchParams.get('end')) : undefined;
    const users = await convex.query(api.queries.users.getAllUsers, {});
    // Calculate stats
    const total_users = users.length;
    const customers = users.filter((u) => u.roles?.includes('customer')).length;
    const chefs = users.filter((u) => u.roles?.includes('chef')).length;
    const admins = users.filter((u) => u.roles?.includes('admin')).length;
    const active_users = users.filter((u) => u.status === 'active').length;
    // User growth (by day)
    const user_growth: UserGrowthData[] = [];
    const growthMap: Record<string, { total_users: number, new_users: number }> = {};
    users.forEach((u) => {
      const date = u._creationTime ? new Date(u._creationTime).toISOString().slice(0, 10) : null;
      if (date) {
        if (!growthMap[date]) growthMap[date] = { total_users: 0, new_users: 0 };
        growthMap[date].new_users += 1;
      }
    });
    let runningTotal = 0;
    Object.keys(growthMap).sort().forEach(date => {
      runningTotal += growthMap[date].new_users;
      growthMap[date].total_users = runningTotal;
      user_growth.push({ date, total_users: growthMap[date].total_users, new_users: growthMap[date].new_users });
    });
    // Period string
    let period = '';
    if (start && end) {
      period = `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`;
    }
    return ResponseFactory.success({
      total_users,
      customers,
      chefs,
      admins,
      active_users,
      user_growth,
      period
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user analytics.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 