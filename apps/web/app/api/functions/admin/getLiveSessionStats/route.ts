import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /functions/admin/getLiveSessionStats:
 *   post:
 *     summary: Get Live Session Statistics (Admin)
 *     description: Retrieve detailed statistics for live streaming sessions within a specified time range. This endpoint provides comprehensive analytics about session performance, viewer engagement, and streaming metrics for administrative oversight.
 *     tags: [Admin, Live Streaming, Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channelName:
 *                 type: string
 *                 description: Specific channel name to get stats for (optional)
 *                 example: "chef_mario_cooking"
 *               timeRange:
 *                 type: string
 *                 enum: [1h, 24h, 7d, 30d]
 *                 description: Time range for statistics aggregation
 *                 example: "24h"
 *     responses:
 *       200:
 *         description: Live session statistics retrieved successfully
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
 *                     totalSessions:
 *                       type: number
 *                       description: Total number of sessions in the time range
 *                       example: 25
 *                     activeSessions:
 *                       type: number
 *                       description: Number of currently active sessions
 *                       example: 3
 *                     totalViewers:
 *                       type: number
 *                       description: Total unique viewers across all sessions
 *                       example: 1250
 *                     averageViewersPerSession:
 *                       type: number
 *                       description: Average number of viewers per session
 *                       example: 50
 *                     totalDuration:
 *                       type: number
 *                       description: Total streaming duration in minutes
 *                       example: 1200
 *                     averageSessionDuration:
 *                       type: number
 *                       description: Average session duration in minutes
 *                       example: 48
 *                     peakViewers:
 *                       type: number
 *                       description: Peak concurrent viewers across all sessions
 *                       example: 150
 *                     engagementMetrics:
 *                       type: object
 *                       properties:
 *                         totalComments:
 *                           type: number
 *                           description: Total comments across all sessions
 *                           example: 500
 *                         totalReactions:
 *                           type: number
 *                           description: Total reactions across all sessions
 *                           example: 1200
 *                         totalOrders:
 *                           type: number
 *                           description: Total orders placed during live sessions
 *                           example: 45
 *                         conversionRate:
 *                           type: number
 *                           description: Order conversion rate (orders per viewer)
 *                           example: 0.036
 *                     topPerformingSessions:
 *                       type: array
 *                       description: Top performing sessions by viewer count
 *                       items:
 *                         type: object
 *                         properties:
 *                           sessionId:
 *                             type: string
 *                             description: Session ID
 *                             example: "session_123"
 *                           chefId:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           peakViewers:
 *                             type: number
 *                             description: Peak viewers for this session
 *                             example: 75
 *                           duration:
 *                             type: number
 *                             description: Session duration in minutes
 *                             example: 60
 *                           ordersPlaced:
 *                             type: number
 *                             description: Orders placed during this session
 *                             example: 8
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid time range or missing parameters
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
 *     security: []
 */

export async function POST(req: NextRequest) {
  const { channelName } = await req.json();
  const result = await fetchQuery(api.queries.liveSessions.adminGetLiveSessionStats, { timeRange: "24h" });
  return ResponseFactory.success(result);
} 