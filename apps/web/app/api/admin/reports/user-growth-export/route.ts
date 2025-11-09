/**
 * @swagger
 * components:
 *   schemas:
 *     UserGrowthExportData:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Date of user signups
 *         signups:
 *           type: number
 *           description: Number of user signups on this date
 *     UserGrowthExportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserGrowthExportData'
 *         message:
 *           type: string
 *           example: "Success"
 */

import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

function toCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return '';
  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','));
  return [header, ...rows].join('\n');
}

/**
 * @swagger
 * /api/admin/reports/user-growth-export:
 *   get:
 *     summary: Export user growth data
 *     description: Export user growth statistics in JSON or CSV format (admin only)
 *     tags: [Admin Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *         description: Start date filter (timestamp)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *         description: End date filter (timestamp)
 *     responses:
 *       200:
 *         description: User growth data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGrowthExportResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV formatted user growth data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    const { userId } = await getAuthenticatedAdmin(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const users = await convex.query(api.queries.users.getAllUsers, {
      sessionToken: sessionToken || undefined
    });
    // Filtering by date range
    let filtered = users;
    if (start) {
      const startTimestamp = Number(start);
      filtered = filtered.filter((u: any) => u._creationTime && u._creationTime >= startTimestamp);
    }
    if (end) {
      const endTimestamp = Number(end);
      filtered = filtered.filter((u: any) => u._creationTime && u._creationTime <= endTimestamp);
    }
    // Group by signup date (_creationTime)
    const byDate: Record<string, number> = {};
    filtered.forEach((u: any) => {
      if (!u._creationTime) return;
      const date = new Date(u._creationTime).toISOString().slice(0, 10);
      byDate[date] = (byDate[date] || 0) + 1;
    });
    const rows = Object.entries(byDate).map(([date, count]) => ({ date, signups: count }));
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'export_user_growth',
      details: { format, start, end },
      adminId: userId,
      sessionToken: sessionToken || undefined
    });
    // Trigger webhook and real-time broadcast (non-blocking)
    const eventPayload = { type: 'user_growth_export', user: userId, format, filters: { start, end }, count: rows.length };
    fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/admin/webhooks-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('authorization') || '' },
      body: JSON.stringify({ event: 'user_growth_export', data: eventPayload, urls: [process.env.ADMIN_WEBHOOK_URL].filter(Boolean) }),
    }).catch(() => {});
    fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/admin/realtime-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('authorization') || '' },
      body: JSON.stringify({ event: 'user_growth_export', data: eventPayload }),
    }).catch(() => {});
    if (format === 'csv') {
      const csv = toCSV(rows);
      return ResponseFactory.csvDownload(csv, 'user-growth-export.csv');
    }
    // Default: JSON
    return ResponseFactory.jsonDownload(rows, 'user-growth-export.json');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to export user growth.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 