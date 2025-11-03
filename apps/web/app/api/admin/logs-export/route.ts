import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

/**
 * @swagger
 * /admin/logs-export:
 *   get:
 *     summary: Export System Logs (Admin)
 *     description: Export system logs in JSON or CSV format with optional filtering. This endpoint allows administrators to download logs for analysis, compliance, or debugging purposes. The export action is logged for audit purposes.
 *     tags: [Admin, System Operations]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format for the logs
 *         example: "csv"
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter logs by specific action
 *         example: "user_login"
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter logs by admin user ID
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: timestamp
 *         description: Start timestamp for log filtering (Unix timestamp)
 *         example: "1640995200000"
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: timestamp
 *         description: End timestamp for log filtering (Unix timestamp)
 *         example: "1641081600000"
 *     responses:
 *       200:
 *         description: Logs exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: Array of log entries (when format=json)
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Log entry ID
 *                     example: "j1234567890abcdef"
 *                   action:
 *                     type: string
 *                     description: Action performed
 *                     example: "user_login"
 *                   adminId:
 *                     type: string
 *                     description: Admin user ID who performed the action
 *                     example: "j0987654321fedcba"
 *                   timestamp:
 *                     type: number
 *                     description: Log timestamp (Unix timestamp)
 *                     example: 1640995200000
 *                   details:
 *                     type: object
 *                     additionalProperties: true
 *                     description: Additional action details
 *                     example: {"ip": "192.168.1.1", "userAgent": "Mozilla/5.0..."}
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV formatted log data (when format=csv)
 *               example: "_id,action,adminId,timestamp,details\nj1234567890abcdef,user_login,j0987654321fedcba,1640995200000,\"{ip:192.168.1.1}\""
 *         headers:
 *           Content-Disposition:
 *             description: File download header
 *             schema:
 *               type: string
 *               example: "attachment; filename=logs-export.json"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
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

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function toCSV(data: any[]): string {
  if (!data.length) return '';
  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','));
  return [header, ...rows].join('\n');
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
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
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can export logs.');
    }
    const convex = getConvexClient();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const action = searchParams.get('action');
    const user = searchParams.get('user');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    let logs = await convex.query(api.queries.adminLogs.getAll, {});
    // Filtering
    if (action) logs = logs.filter((l: any) => l.action === action);
    if (user) logs = logs.filter((l: any) => l.adminId === user);
    if (start) logs = logs.filter((l: any) => l.timestamp >= Number(start));
    if (end) logs = logs.filter((l: any) => l.timestamp <= Number(end));
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'export_logs',
      details: { format, action, user, start, end },
      adminId: payload.user_id,
    });
    // Trigger webhook and real-time broadcast (non-blocking)
    const eventPayload = { type: 'logs_export', user: payload.user_id, format, filters: { action, user, start, end }, count: logs.length };
    fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/admin/webhooks-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('authorization') || '' },
      body: JSON.stringify({ event: 'logs_export', data: eventPayload, urls: [process.env.ADMIN_WEBHOOK_URL].filter(Boolean) }),
    }).catch(() => {});
    fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/admin/realtime-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('authorization') || '' },
      body: JSON.stringify({ event: 'logs_export', data: eventPayload }),
    }).catch(() => {});
    if (format === 'csv') {
      const csv = toCSV(logs);
      return ResponseFactory.csvDownload(csv, 'logs-export.csv');
    }
    // Default: JSON
    return ResponseFactory.jsonDownload(logs, 'logs-export.json');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to export logs.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 