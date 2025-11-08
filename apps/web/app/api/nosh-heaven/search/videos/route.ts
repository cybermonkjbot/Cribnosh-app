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
 * /api/nosh-heaven/search/videos:
 *   get:
 *     summary: Search videos
 *     description: Searches for videos based on query, cuisine, difficulty, and tags
 *     tags: [Nosh Heaven, Search, Videos]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "pasta recipe"
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filter by cuisine type
 *         example: "Italian"
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *         example: "intermediate"
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *         example: ["vegetarian", "quick"]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoPost'
 *                     nextCursor:
 *                       type: string
 *                       description: Cursor for next page
 *                 message:
 *                   type: string
 *                   example: "Search results retrieved successfully"
 *       400:
 *         description: Validation error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const cuisine = searchParams.get('cuisine') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const tags = searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const cursor = searchParams.get('cursor') || undefined;

    if (!query || query.trim().length === 0) {
      return ResponseFactory.validationError('Search query is required');
    }

    const convex = getConvexClient();
    const results = await convex.query((api as any).queries.videoPosts.searchVideos, {
      query: query.trim(),
      cuisine,
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
      tags,
      limit,
      cursor,
    });

    return ResponseFactory.success(results, 'Search results retrieved successfully');

  } catch (error: any) {
    logger.error('Video search error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to search videos');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
