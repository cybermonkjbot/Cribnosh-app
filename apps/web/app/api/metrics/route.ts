import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get System Metrics
 *     description: Retrieve system-wide metrics including user counts, reviews, orders, and uptime
 *     tags: [Analytics, Monitoring]
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
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
 *                     totalUsers:
 *                       type: number
 *                       description: Total number of registered users
 *                       example: 15420
 *                     totalReviews:
 *                       type: number
 *                       description: Total number of reviews submitted
 *                       example: 8920
 *                     totalCustomOrders:
 *                       type: number
 *                       description: Total number of custom orders placed
 *                       example: 1250
 *                     totalWaitlist:
 *                       type: number
 *                       description: Total number of waitlist entries
 *                       example: 3500
 *                     totalDrivers:
 *                       type: number
 *                       description: Total number of registered drivers
 *                       example: 180
 *                     uptime:
 *                       type: number
 *                       description: Server uptime in seconds
 *                       example: 86400
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when metrics were generated
 *                       example: "2024-01-15T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

export async function GET(request: NextRequest) {
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  // Fetch metrics from Convex
  const [users, reviews, customOrders, waitlist, drivers] = await Promise.all([
    convex.query(api.queries.users.getAllUsers, {
      sessionToken: sessionToken || undefined
    }),
    convex.query(api.queries.reviews.getAll, {
      sessionToken: sessionToken || undefined
    }).catch(() => []),
    convex.query(api.queries.custom_orders?.getAll || api.queries.custom_orders?.getAllOrders || (() => []), {
      sessionToken: sessionToken || undefined
    }).catch(() => []),
    convex.query(api.queries.waitlist.getAll, {
      sessionToken: sessionToken || undefined
    }),
    convex.query(api.queries.drivers.getAll, {
      sessionToken: sessionToken || undefined
    }).catch(() => []),
  ]);
  const metrics = {
    totalUsers: users.length,
    totalReviews: reviews.length,
    totalCustomOrders: customOrders.length,
    totalWaitlist: waitlist.length,
    totalDrivers: drivers.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  return ResponseFactory.success(metrics);
} 