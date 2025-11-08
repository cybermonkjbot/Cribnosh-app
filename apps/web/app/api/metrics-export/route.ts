import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

function toCSV(data: Record<string, any>): string {
  const keys = Object.keys(data);
  const header = keys.join(',');
  const row = keys.map(k => JSON.stringify(data[k] ?? '')).join(',');
  return [header, row].join('\n');
}

/**
 * @swagger
 * /metrics-export:
 *   get:
 *     summary: Export System Metrics (Admin)
 *     description: Export comprehensive system metrics in JSON or CSV format for administrative analysis
 *     tags: [Admin, Metrics, Export]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *         example: "json"
 *     responses:
 *       200:
 *         description: Metrics exported successfully
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
 *                       description: Total number of users
 *                       example: 1250
 *                     totalReviews:
 *                       type: number
 *                       description: Total number of reviews
 *                       example: 3400
 *                     totalCustomOrders:
 *                       type: number
 *                       description: Total number of custom orders
 *                       example: 890
 *                     totalWaitlist:
 *                       type: number
 *                       description: Total number of waitlist entries
 *                       example: 150
 *                     totalDrivers:
 *                       type: number
 *                       description: Total number of drivers
 *                       example: 45
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                       example: 86400
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Export timestamp
 *                       example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *         headers:
 *           Content-Disposition:
 *             description: File download header
 *             schema:
 *               type: string
 *               example: "attachment; filename=metrics-export.json"
 *           Content-Type:
 *             description: Content type based on format
 *             schema:
 *               type: string
 *               example: "application/json"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can export metrics
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
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can export metrics.');
    }
    const convex = getConvexClient();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    // Fetch metrics from Convex
    const [users, reviews, customOrders, waitlist, drivers] = await Promise.all([
      convex.query(api.queries.users.getAllUsers, {}),
      convex.query(api.queries.reviews.getAll, {}).catch(() => []),
      convex.query(api.queries.custom_orders?.getAll || api.queries.custom_orders?.getAllOrders || (() => []), {}).catch(() => []),
      convex.query(api.queries.waitlist.getAll, {}),
      convex.query(api.queries.drivers.getAll, {}).catch(() => []),
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
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'export_metrics',
      details: { format },
      adminId: userId,
      timestamp: Date.now(),
    });
    // Trigger webhook and real-time broadcast (non-blocking)
    const eventPayload = { type: 'metrics_export', user: userId, format, count: Object.keys(metrics).length };
    fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/admin/webhooks-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('authorization') || '' },
      body: JSON.stringify({ event: 'metrics_export', data: eventPayload, urls: [process.env.ADMIN_WEBHOOK_URL].filter(Boolean) }),
    }).catch(() => {});
    fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/admin/realtime-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('authorization') || '' },
      body: JSON.stringify({ event: 'metrics_export', data: eventPayload }),
    }).catch(() => {});
    if (format === 'csv') {
      const csv = toCSV(metrics);
      return ResponseFactory.csvDownload(csv, 'metrics-export.csv');
    }
    // Default: JSON
    return ResponseFactory.jsonDownload(metrics, 'metrics-export.json');
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
} 