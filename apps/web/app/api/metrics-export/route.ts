import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
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
      adminId: payload.user_id,
      timestamp: Date.now(),
    });
    // Trigger webhook and real-time broadcast (non-blocking)
    const eventPayload = { type: 'metrics_export', user: payload.user_id, format, count: Object.keys(metrics).length };
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
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to export metrics.' );
  }
} 