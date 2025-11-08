// Implements GET for /admin/{document_id}/download to get a presigned URL for downloading a document
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/{document_id}/download:
 *   get:
 *     summary: Get Document Download URL (Admin)
 *     description: Generate a presigned URL for downloading a document file. Only accessible by administrators for security purposes.
 *     tags: [Admin, Document Management]
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the document to download
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Download URL generated successfully
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
 *                       format: uri
 *                       description: Presigned download URL with expiration
 *                       example: "https://storage.example.com/documents/doc123.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: URL expiration timestamp
 *                       example: "2024-01-15T11:30:00Z"
 *                     fileName:
 *                       type: string
 *                       description: Original file name
 *                       example: "chef_license.pdf"
 *                     fileSize:
 *                       type: number
 *                       description: File size in bytes
 *                       example: 1024000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing document_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found or presigned URL not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

function extractDocumentIdFromUrl(request: NextRequest): Id<'documents'> | undefined {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/admin\/([^/]+)\/download/);
  return match ? (match[1] as Id<'documents'>) : undefined;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const document_id = extractDocumentIdFromUrl(request);
    if (!document_id) {
      return ResponseFactory.validationError('Missing document_id');
    }
    const convex = getConvexClientFromRequest(request);
    const url = await convex.query(api.queries.documents.getPresignedDownloadUrl, { document_id });
    if (!url) {
      return ResponseFactory.notFound('Presigned URL not found.');
    }
    return ResponseFactory.success({ url });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
