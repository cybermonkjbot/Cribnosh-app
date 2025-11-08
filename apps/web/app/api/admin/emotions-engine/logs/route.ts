/**
 * @swagger
 * /api/admin/emotions-engine/logs:
 *   get:
 *     summary: Get emotions engine logs
 *     description: Retrieve logs from the AI emotions engine with optional filtering
 *     tags: [Admin - Emotions Engine]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: Filter by AI provider
 *       - in: query
 *         name: intent
 *         schema:
 *           type: string
 *         description: Filter by intent type
 *       - in: query
 *         name: from
 *         schema:
 *           type: number
 *         description: Start timestamp for filtering
 *       - in: query
 *         name: to
 *         schema:
 *           type: number
 *         description: End timestamp for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
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
 *                     total:
 *                       type: number
 *                       description: Total number of logs
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */

import { api } from '@/convex/_generated/api';
import { getUserFromRequest } from '@/lib/auth/session';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
    return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || undefined;
  const provider = searchParams.get('provider') || undefined;
  const intent = searchParams.get('intent') || undefined;
  const from = searchParams.get('from') ? Number(searchParams.get('from')) : undefined;
  const to = searchParams.get('to') ? Number(searchParams.get('to')) : undefined;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
  const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
  const { getConvexClient } = await import('@/lib/conxed-client');
  const convex = getConvexClient();
  // Use the correct query for logs
  interface EmotionsEngineLog {
    userId?: string;
    provider?: string;
    timestamp?: number;
    response?: {
      intent?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }
  const all = await convex.query(api.queries.emotionsEngine.getAllLogs, {}) as EmotionsEngineLog[];
  // Apply filtering in JS if needed
  let results = all;
  if (userId) results = results.filter((log: EmotionsEngineLog) => log.userId === userId);
  if (provider) results = results.filter((log: EmotionsEngineLog) => log.provider === provider);
  if (intent) results = results.filter((log: EmotionsEngineLog) => log.response?.intent === intent);
  if (from) results = results.filter((log: EmotionsEngineLog) => (log.timestamp || 0) >= from);
  if (to) results = results.filter((log: EmotionsEngineLog) => (log.timestamp || 0) <= to);
  const paged = results.slice(offset, offset + limit);
  return ResponseFactory.success({ total: results.length, results: paged });
} 