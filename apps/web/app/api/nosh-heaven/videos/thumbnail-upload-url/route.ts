import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { generateThumbnailUploadUrl, validateThumbnailFile } from '@/lib/s3-config';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /api/nosh-heaven/videos/thumbnail-upload-url:
 *   post:
 *     summary: Generate presigned URL for thumbnail upload
 *     description: Creates a presigned URL for uploading video thumbnails to S3
 *     tags: [Nosh Heaven, Videos]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoId
 *               - fileName
 *               - fileSize
 *               - contentType
 *             properties:
 *               videoId:
 *                 type: string
 *                 description: ID of the video post
 *                 example: "j1234567890abcdef"
 *               fileName:
 *                 type: string
 *                 description: Name of the thumbnail file
 *                 example: "thumbnail.jpg"
 *               fileSize:
 *                 type: number
 *                 description: Size of the file in bytes
 *                 example: 1048576
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file
 *                 example: "image/jpeg"
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
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
 *                       description: Presigned URL for uploading
 *                     key:
 *                       type: string
 *                       description: S3 object key
 *                     publicUrl:
 *                       type: string
 *                       description: Public URL for accessing the thumbnail
 *                 message:
 *                   type: string
 *                   example: "Thumbnail upload URL generated successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { videoId, fileName, fileSize, contentType } = await request.json();

    if (!videoId || !fileName || !fileSize || !contentType) {
      return ResponseFactory.validationError('videoId, fileName, fileSize, and contentType are required');
    }

    // Validate file
    const validation = validateThumbnailFile({ name: fileName, size: fileSize, type: contentType });
    if (!validation.isValid) {
      return ResponseFactory.validationError(validation.error || 'Invalid thumbnail file');
    }

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const user = await convex.query(api.queries.users.getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Check if user is a chef or food creator
    const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
    if (!isChef) {
      return ResponseFactory.forbidden('Only chefs and food creators can upload thumbnails');
    }

    // Verify video ownership
    const video = await convex.query((api as any).queries.videoPosts.getVideoById, { videoId });
    if (!video) {
      return ResponseFactory.notFound('Video not found');
    }

    if (video.creatorId !== user._id && !user.roles?.includes('admin')) {
      return ResponseFactory.forbidden('Not authorized to upload thumbnail for this video');
    }

    // Generate presigned URL
    const uploadData = await generateThumbnailUploadUrl(user._id, videoId, fileName, contentType);

    return ResponseFactory.success({
      uploadUrl: uploadData.uploadUrl,
      key: uploadData.key,
      publicUrl: uploadData.publicUrl,
    }, 'Thumbnail upload URL generated successfully');

  } catch (error: any) {
    console.error('Thumbnail upload URL generation error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to generate thumbnail upload URL');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
