import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAdminAuth } from '@/lib/api/admin-middleware';
import { getUserFromRequest } from '@/lib/auth/session';

/**
 * @swagger
 * /api/nosh-heaven/admin/videos:
 *   get:
 *     summary: Get all videos for admin
 *     description: Retrieves all videos with admin details for moderation
 *     tags: [Nosh Heaven, Admin, Videos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived, flagged, removed]
 *         description: Filter by video status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of videos to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
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
 *                   example: "Videos retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const cursor = searchParams.get('cursor') || undefined;

    const convex = getConvexClient();
    
    // Get videos based on status filter
    let videos;
    if (status) {
      videos = await convex.query((api as any).queries.videoPosts.getVideoFeed, {
        limit,
        cursor,
      });
      // Filter by status on the client side for now
      // In production, you'd want a proper index for this
      videos.videos = videos.videos.filter((video: any) => video.status === status);
    } else {
      videos = await convex.query((api as any).queries.videoPosts.getVideoFeed, {
        limit,
        cursor,
      });
    }

    return ResponseFactory.success(videos, 'Videos retrieved successfully');

  } catch (error: any) {
    console.error('Admin videos retrieval error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to retrieve videos');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(withAdminAuth(handleGET)));
