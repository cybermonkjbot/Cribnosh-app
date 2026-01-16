import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { ErrorCode, ErrorFactory } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /upload-avatar:
 *   post:
 *     summary: Upload User Avatar
 *     description: Upload and store a user avatar image file
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload as avatar
 *                 maxLength: 5242880
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL to access the uploaded avatar
 *                   example: "/api/files/j1234567890abcdef"
 *                 storageId:
 *                   type: string
 *                   description: Convex storage ID for the uploaded file
 *                   example: "j1234567890abcdef"
 *       400:
 *         description: Bad request - invalid file or missing file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No file uploaded"
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Method not allowed"
 *       500:
 *         description: Internal server error during upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to upload image"
 *                 details:
 *                   type: string
 *                   example: "Convex upload error"
 *     security:
 *       - cookieAuth: []
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = (formData as any).get('file') as File;

    if (!file) {
      return ResponseFactory.error('No file uploaded', 'CUSTOM_ERROR', 400);
    }

    if (!file.type.startsWith('image/')) {
      return ResponseFactory.error('Only image files are allowed', 'CUSTOM_ERROR', 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return ResponseFactory.error('File size exceeds 5MB', 'CUSTOM_ERROR', 400);
    }

    try {
      const convex = getConvexClient();
      const sessionToken = getSessionTokenFromRequest(request);
      // 1. Generate a Convex upload URL
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      // 2. Upload the file to Convex storage
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: buffer
      });

      if (!uploadRes.ok) {
        return ResponseFactory.error('Failed to upload to Convex storage', 'CUSTOM_ERROR', 500);
      }

      const result = await uploadRes.json();
      if (!result.storageId) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'No storageId in upload response');
      }

      const { storageId } = result;
      // 3. Return the Convex file URL (or storageId)
      const fileUrl = `/api/files/${storageId}`;
      return ResponseFactory.success({ url: fileUrl, storageId });
    } catch (e) {
      logger.error('Convex upload error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      return ResponseFactory.error(`Failed to upload image: ${errorMessage}`, 'CUSTOM_ERROR', 500);
    }
  } catch (error) {
    logger.error('Error processing upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return ResponseFactory.error(`Error processing file upload: ${errorMessage}`, 'CUSTOM_ERROR', 500);
  }
} 