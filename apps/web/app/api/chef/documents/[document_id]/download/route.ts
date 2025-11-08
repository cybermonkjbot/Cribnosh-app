import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /chef/documents/{document_id}/download:
 *   get:
 *     summary: Download Chef Document
 *     description: Get a presigned download URL for a specific document uploaded by the authenticated chef
 *     tags: [Chef, Documents]
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Presigned download URL generated successfully
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
 *                       description: Presigned download URL
 *                       example: "https://storage.example.com/download?signature=..."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing document_id
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
 *         description: Forbidden - only chefs can download documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found, not owned by chef, or presigned URL not found
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);
    // Extract document_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/documents\/([^/]+)\/download/);
    const document_id = match ? match[1] : undefined;
    if (!document_id) {
      return ResponseFactory.validationError('Missing document_id');
    }
    const convex = getConvexClient();
    const document = await convex.query(api.queries.documents.getById, { documentId: document_id as any });
    if (!document || document.userEmail !== user.email) {
      return ResponseFactory.notFound('Document not found or not owned by chef.');
    }
    // Use document_id for download URL
    const urlResult = await convex.query(api.queries.documents.getPresignedDownloadUrl, { document_id: document_id as any });
    if (!urlResult) {
      return ResponseFactory.notFound('Presigned URL not found.');
    }
    return ResponseFactory.success({ url: urlResult });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
