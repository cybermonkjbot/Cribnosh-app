// Implements POST for /admin/{document_id}/review to review a document (approve/reject/expire)
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { ResponseFactory } from '@/lib/api';

/**
 * @swagger
 * /admin/{document_id}/review-new:
 *   post:
 *     summary: Review New Document (Admin)
 *     description: Submit a review decision for a newly uploaded document using the updated review system. Only accessible by administrators.
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
 *               reviewerComments:
 *                 type: string
 *                 description: Additional reviewer comments
 *                 example: "All documentation is complete and valid"
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
 *                     reviewId:
 *                       type: string
 *                       description: ID of the review record
 *                       example: "j0987654321fedcba"
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
 *       - bearerAuth: []
 */

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function extractDocumentIdFromUrl(request: NextRequest): Id<'documents'> | undefined {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/admin\/([^/]+)\/review/);
  return match ? (match[1] as Id<'documents'>) : undefined;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can review documents.');
    }
    const document_id = extractDocumentIdFromUrl(request);
    if (!document_id) {
      return ResponseFactory.validationError('Missing document_id');
    }
    const { status, notes } = await request.json();
    if (!status || !['approved', 'rejected', 'expired'].includes(status)) {
      return ResponseFactory.validationError('Invalid status');
    }
    const convex = getConvexClient();
    await convex.mutation(api.mutations.documents.updateDocumentStatus, {
      documentId: document_id,
      status,
      // notes: notes || '', // Add this if your mutation supports notes in the future
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to review document.' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
