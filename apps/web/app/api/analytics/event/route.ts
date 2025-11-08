import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient, getApiFunction } from '@/lib/conxed-client';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

interface AnalyticsEvent {
  type: string;
  timestamp?: number;
  page?: string;
  x?: number;
  y?: number;
  extra?: Record<string, any>;
}

/**
 * @swagger
 * /analytics/event:
 *   post:
 *     summary: Track Analytics Events
 *     description: Track user interaction events for analytics and heatmap data
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - events
 *             properties:
 *               events:
 *                 type: array
 *                 description: Array of analytics events to track
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Event type identifier
 *                       example: "page_view"
 *                     timestamp:
 *                       type: number
 *                       nullable: true
 *                       description: Event timestamp (defaults to current time)
 *                       example: 1640995200000
 *                     page:
 *                       type: string
 *                       nullable: true
 *                       description: Page URL or identifier
 *                       example: "/customer/menu"
 *                     x:
 *                       type: number
 *                       nullable: true
 *                       description: X coordinate for click events
 *                       example: 150
 *                     y:
 *                       type: number
 *                       nullable: true
 *                       description: Y coordinate for click events
 *                       example: 300
 *                     extra:
 *                       type: object
 *                       nullable: true
 *                       description: Additional event data
 *                       example: {"user_agent": "Mozilla/5.0", "session_id": "abc123"}
 *     responses:
 *       200:
 *         description: Events tracked successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error or analytics processing failed
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
  try {
    const { events } = await req.json();
    const convex = getConvexClient();
    const saveAnalyticsEvent = getApiFunction('mutations/analytics', 'saveAnalyticsEvent') as any;

    // Process events in parallel with a concurrency limit
    const BATCH_SIZE = 5;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((event: AnalyticsEvent) => 
          convex.mutation(saveAnalyticsEvent, {
            event_type: event.type,
            timestamp: event.timestamp || Date.now(),
            data: {
              page: event.page,
              x: event.x,
              y: event.y,
              ...event.extra
            }
          })
        )
      );
    }

    return ResponseFactory.success({ success: true });
  } catch (error) {
    logger.error('Analytics event error:', error);
    return ResponseFactory.error(
      (error as Error).message,
      'ANALYTICS_ERROR',
      400
    );
  }
}
