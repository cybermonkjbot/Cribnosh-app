import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /files/confirm-upload:
 *   post:
 *     summary: Confirm File Upload
 *     description: Confirm that a file upload has been completed and update the file record status. This should be called after uploading a file to the upload URL.
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storageId
 *               - fileName
 *               - contentType
 *             properties:
 *               storageId:
 *                 type: string
 *                 description: Storage ID returned from the upload response
 *                 example: "k1234567890abcdef"
 *               fileName:
 *                 type: string
 *                 description: Name of the uploaded file
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
 *         description: File upload confirmed successfully
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
 *                     fileId:
 *                       type: string
 *                       description: File record ID
 *                       example: "k1234567890abcdef"
 *                     fileUrl:
 *                       type: string
 *                       description: URL to access the file
 *                       example: "/api/files/k1234567890abcdef"
 *                     storageId:
 *                       type: string
 *                       description: Storage ID
 *                       example: "k1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields
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
    const { storageId, fileName, contentType, fileSize, metadata } = body;

    // Validate request body
    if (!storageId || !fileName || !contentType) {
      return ResponseFactory.validationError('Missing required fields: storageId, fileName, and contentType are required');
    }

    // Construct file URL
    const fileUrl = `/api/files/${storageId}`;

    // TODO: Create file record in database if needed
    // For now, we'll just return the file URL
    // In a full implementation, you would create a file record:
    // const fileRecord = await convex.mutation(api.mutations.files.createFileRecord, {
    //   storageId,
    //   fileName,
    //   contentType,
    //   fileSize,
    //   fileUrl,
    //   uploadedBy: userId,
    //   metadata,
    // });

    return ResponseFactory.success({
      fileId: storageId, // Using storageId as fileId for now
      fileUrl,
      storageId,
      fileName,
      contentType,
      fileSize,
      metadata,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to confirm file upload.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

