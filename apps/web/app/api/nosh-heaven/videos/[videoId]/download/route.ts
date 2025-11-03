import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getApiFunction, getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/nosh-heaven/videos/{videoId}/download:
 *   get:
 *     summary: Get video download URL
 *     description: Retrieves the video URL for download/streaming from Convex storage
 *     tags: [Nosh Heaven, Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video download URL retrieved successfully
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
 *                     videoId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     downloadUrl:
 *                       type: string
 *                       description: Public URL to download/stream the video
 *                       example: "https://cdn.convex.cloud/storage/file/..."
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
): Promise<NextResponse> {
  try {
    const { videoId } = params;

    if (!videoId) {
      return ResponseFactory.validationError('Video ID is required');
    }

    const convex = getConvexClient();
    
    // Get video post to retrieve storage ID
    const getVideoById = getApiFunction('queries/videoPosts', 'getVideoById');
    const video = await convex.query(getVideoById, { videoId: videoId as any });

    if (!video) {
      return ResponseFactory.notFound('Video not found');
    }

    // The video object already contains videoUrl from the query
    // which is generated from the storage ID
    const downloadUrl = video.videoUrl;

    if (!downloadUrl) {
      return ResponseFactory.internalError('Video URL could not be generated');
    }

    return ResponseFactory.success({
      videoId,
      downloadUrl,
    }, 'Video download URL retrieved successfully');

  } catch (error: unknown) {
    console.error('Error in video download:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve video download URL';
    
    if (message.includes('not found')) {
      return ResponseFactory.notFound(message);
    }
    
    return ResponseFactory.internalError(message);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const videoId = url.pathname.split('/')[4];
  return handleGET(request, { params: { videoId } });
}));
