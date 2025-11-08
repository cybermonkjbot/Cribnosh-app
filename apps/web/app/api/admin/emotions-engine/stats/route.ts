/**
 * @swagger
 * components:
 *   schemas:
 *     EmotionsEngineStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of emotion engine interactions
 *         byProvider:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Count of interactions by provider
 *         byIntent:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Count of interactions by intent
 *         errorRate:
 *           type: number
 *           description: Error rate as a decimal (0-1)
 *         recent:
 *           type: array
 *           description: Recent emotion engine interactions
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               userId:
 *                 type: string
 *               provider:
 *                 type: string
 *               timestamp:
 *                 type: number
 *               response:
 *                 type: object
 */

import { api } from '@/convex/_generated/api';
import { getUserFromRequest } from '@/lib/auth/session';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /api/admin/emotions-engine/stats:
 *   get:
 *     summary: Get emotions engine statistics
 *     description: Retrieve comprehensive statistics about the emotions engine performance (admin only)
 *     tags: [Admin Emotions Engine]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Emotions engine statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EmotionsEngineStats'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
    return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
  }
  const { getConvexClient } = await import('@/lib/conxed-client');
  const convex = getConvexClient();
  const all = await convex.query(api.queries.emotionsEngine.getAllLogs, {});
  const total = all.length;
  interface EmotionsEngineLog {
    provider?: string;
    intent?: string;
    error?: boolean;
    [key: string]: unknown;
  }
  const byProvider: Record<string, number> = {};
  const byIntent: Record<string, number> = {};
  let errorCount = 0;
  let recent: EmotionsEngineLog[] = [];
  if (total > 0) {
    recent = all.slice(-10).reverse();
    for (const log of all) {
      byProvider[log.provider] = (byProvider[log.provider] || 0) + 1;
      const intent = log.response?.intent || 'unknown';
      byIntent[intent] = (byIntent[intent] || 0) + 1;
      if (log.response?.response_type === 'fallback' || log.response?.error) errorCount++;
    }
  }
  const errorRate = total > 0 ? errorCount / total : 0;
  return ResponseFactory.success({
    total,
    byProvider,
    byIntent,
    errorRate,
    recent,
  });
} 