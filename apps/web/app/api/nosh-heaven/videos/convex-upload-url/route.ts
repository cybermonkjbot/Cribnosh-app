import { NextRequest, NextResponse } from 'next/server';
import { getApiFunction, getConvexClient } from '@/lib/conxed-client';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getUserFromRequest } from '@/lib/auth/session';

/**
 * @swagger
 * /api/nosh-heaven/videos/convex-upload-url:
 *   post:
 *     summary: Generate Convex upload URL for video
 *     description: Creates a Convex storage upload URL for uploading videos to Nosh Heaven
 *     tags: [Nosh Heaven, Videos]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
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
 *                     uploadUrl:
 *                       type: string
 *                       description: Convex storage upload URL
 *                       example: "https://convex-storage.example.com/upload/..."
 *                 message:
 *                   type: string
 *                   example: "Upload URL generated successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only chefs and food creators can upload videos
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user from session token
    const convex = getConvexClient();
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Check if user is a chef or food creator
    const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
    if (!isChef) {
      return ResponseFactory.forbidden('Only chefs and food creators can upload videos');
    }

    // Generate Convex upload URL using the videoPosts mutation
    const generateVideoUploadUrl = getApiFunction('mutations/videoPosts', 'generateVideoUploadUrl');
    const uploadUrl = await convex.mutation(generateVideoUploadUrl, {});

    return ResponseFactory.success({
      uploadUrl,
    }, 'Upload URL generated successfully');

  } catch (error: any) {
    console.error('Convex upload URL generation error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to generate upload URL');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

