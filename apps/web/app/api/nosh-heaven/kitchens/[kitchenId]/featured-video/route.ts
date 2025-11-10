import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getApiFunction, getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/nosh-heaven/kitchens/{kitchenId}/featured-video:
 *   get:
 *     summary: Get featured video for a kitchen
 *     description: Retrieves the featured video associated with a specific kitchen
 *     tags: [Nosh Heaven, Kitchens, Videos]
 *     parameters:
 *       - in: path
 *         name: kitchenId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the kitchen
 *     responses:
 *       200:
 *         description: Featured video retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VideoPost'
 *                 message:
 *                   type: string
 *                   example: "Featured video retrieved successfully"
 *       404:
 *         description: Kitchen or featured video not found
 *       500:
 *         description: Internal server error
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { kitchenId: string } }
): Promise<NextResponse> {
  try {
    const { kitchenId } = params;

    if (!kitchenId) {
      return ResponseFactory.validationError('Kitchen ID is required');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const getFeaturedVideo = getApiFunction('queries/kitchens', 'getFeaturedVideo') as any;
    const featuredVideo = await convex.query(getFeaturedVideo, {
      kitchenId,
      sessionToken: sessionToken || undefined
    });

    if (!featuredVideo) {
      return ResponseFactory.notFound('Kitchen or featured video not found');
    }

    return ResponseFactory.success(
      featuredVideo,
      'Featured video retrieved successfully'
    );

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Featured video retrieval error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to retrieve featured video'));
  }
}

// Wrapper function to extract params from URL
export const GET = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    // Extract kitchenId from /api/nosh-heaven/kitchens/[kitchenId]/featured-video
    const pathParts = url.pathname.split('/');
    const kitchenIdIndex = pathParts.indexOf('kitchens') + 1;
    const kitchenId = pathParts[kitchenIdIndex];
    return handleGET(request, { params: { kitchenId } });
  })
);

