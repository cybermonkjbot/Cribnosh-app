// Implements POST for /admin/{document_id}/review to review a document (approve/reject/expire)
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';

/**
 * @swagger
 * /admin/{document_id}/review:
 *   post:
 *     summary: Review Document (Admin)
 *     description: Submit a review decision for a document (approve, reject, or mark as expired). Only accessible by administrators.
 *     tags: [Admin, Document Management]
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the document to review
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, expired]
 *                 description: Review decision for the document
 *                 example: "approved"
 *               notes:
 *                 type: string
 *                 description: Optional review notes or comments
 *                 example: "Document meets all requirements"
 *     responses:
 *       200:
 *         description: Document review submitted successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing document_id or invalid status
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
 *         description: Forbidden - only admins can review documents
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
  const match = url.pathname.match(/\/admin\/([^/]+)\/review/);
  return match ? (match[1] as Id<'documents'>) : undefined;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const document_id = extractDocumentIdFromUrl(request);
    if (!document_id) {
      return ResponseFactory.validationError('Missing document_id');
    }
    const { status, notes } = await request.json();
    if (!status || !['approved', 'rejected', 'expired'].includes(status)) {
      return ResponseFactory.validationError('Invalid status');
    }
    const convex = getConvexClientFromRequest(request);
    await convex.mutation(api.mutations.documents.updateDocumentStatus, {
      documentId: document_id,
      status,
      // notes: notes || '', // Add this if your mutation supports notes in the future
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
