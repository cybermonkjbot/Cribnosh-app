import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { generateVideoUploadUrl, validateVideoFile } from '@/lib/s3-config';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getUserFromRequest } from '@/lib/auth/session';

/**
 * @swagger
 * /api/nosh-heaven/videos/upload-url:
 *   post:
 *     summary: Generate presigned URL for video upload
 *     description: Creates a presigned URL for uploading videos to S3 for Nosh Heaven
 *     tags: [Nosh Heaven, Videos]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileSize
 *               - contentType
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name of the video file
 *                 example: "my-cooking-video.mp4"
 *               fileSize:
 *                 type: number
 *                 description: Size of the file in bytes
 *                 example: 52428800
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file
 *                 example: "video/mp4"
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               data:
 *                 type: object
 *                 properties:
 *                   uploadUrl:
 *                     type: string
 *                     description: Presigned URL for uploading
 *                     example: "https://s3.amazonaws.com/bucket/videos/user123/1234567890_my-cooking-video.mp4?X-Amz-Algorithm=..."
 *                   key:
 *                     type: string
 *                     description: S3 object key
 *                     example: "videos/user123/1234567890_my-cooking-video.mp4"
 *                   publicUrl:
 *                     type: string
 *                     description: Public URL for accessing the video
 *                     example: "https://cdn.noshheaven.com/videos/user123/1234567890_my-cooking-video.mp4"
 *               message:
 *                 type: string
 *                 example: "Upload URL generated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User not authorized to upload videos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { fileName, fileSize, contentType } = await request.json();

    if (!fileName || !fileSize || !contentType) {
      return ResponseFactory.validationError('fileName, fileSize, and contentType are required');
    }

    // Validate file
    const validation = validateVideoFile({ name: fileName, size: fileSize, type: contentType });
    if (!validation.isValid) {
      return ResponseFactory.validationError(validation.error || 'Invalid file');
    }

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

    // Generate presigned URL
    const uploadData = await generateVideoUploadUrl(user._id, fileName, contentType);

    return ResponseFactory.success({
      uploadUrl: uploadData.uploadUrl,
      key: uploadData.key,
      publicUrl: uploadData.publicUrl,
    }, 'Upload URL generated successfully');

  } catch (error: any) {
    console.error('Video upload URL generation error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to generate upload URL');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
