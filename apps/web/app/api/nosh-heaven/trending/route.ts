import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/nosh-heaven/trending:
 *   get:
 *     summary: Get trending videos
 *     description: Retrieves trending videos based on engagement metrics
 *     tags: [Nosh Heaven, Videos, Trending]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of videos to return
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, all]
 *           default: "7d"
 *         description: Time range for trending calculation
 *     responses:
 *       200:
 *         description: Trending videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/VideoPost'
 *                       - type: object
 *                         properties:
 *                           engagementScore:
 *                             type: number
 *                             description: Calculated engagement score
 *                             example: 0.75
 *                 message:
 *                   type: string
 *                   example: "Trending videos retrieved successfully"
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const timeRange = searchParams.get('timeRange') as '24h' | '7d' | '30d' | 'all' | undefined;

    const convex = getConvexClient();
    const trendingVideos = await convex.query((api as any).queries.videoPosts.getTrendingVideos, {
      limit,
      timeRange,
    });

    return ResponseFactory.success(trendingVideos, 'Trending videos retrieved successfully');

  } catch (error: any) {
    logger.error('Trending videos retrieval error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to retrieve trending videos');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
