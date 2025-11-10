import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /files/upload-url:
 *   post:
 *     summary: Generate File Upload URL
 *     description: Generate a presigned upload URL for file uploads. Returns a URL that can be used to upload files directly to Convex storage.
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - contentType
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name of the file to upload
 *                 example: "document.pdf"
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file
 *                 example: "application/pdf"
 *               fileSize:
 *                 type: integer
 *                 nullable: true
 *                 description: Size of the file in bytes
 *                 example: 1024000
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional file metadata
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
 *                     url:
 *                       type: string
 *                       description: Presigned upload URL
 *                       example: "https://convex-storage.example.com/upload/..."
 *                     objectKey:
 *                       type: string
 *                       description: Unique object key for the file
 *                       example: "files/u1234567890abcdef/uuid-document.pdf"
 *                     storageType:
 *                       type: string
 *                       description: Storage provider type
 *                       example: "convex"
 *                     expiresAt:
 *                       type: number
 *                       description: URL expiration timestamp
 *                       example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing fileName or contentType
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedUser(request);
    const convex = getConvexClientFromRequest(request);

    const body = await request.json();
    const { fileName, contentType, fileSize, metadata } = body;

    // Validate request body
    if (!fileName || !contentType) {
      return ResponseFactory.validationError('Missing fileName or contentType');
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return ResponseFactory.validationError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Validate content type (images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return ResponseFactory.validationError('Invalid file type. Only images (JPEG, PNG, WebP) and PDFs are allowed.');
    }

    // Generate an upload URL from Convex
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

    // Generate a unique object key for this user
    const objectKey = `files/${userId}/${randomUUID()}-${fileName}`;

    // Calculate expiration (1 hour from now)
    const expiresAt = Date.now() + (60 * 60 * 1000);

    return ResponseFactory.success({
      url: uploadUrl,
      objectKey,
      storageType: 'convex',
      expiresAt,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to generate upload URL.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

