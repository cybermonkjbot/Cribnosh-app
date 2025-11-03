import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
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
    if (payload.role !== 'chef') {
      return ResponseFactory.forbidden('Forbidden: Only chefs can download documents.');
    }
    // Extract document_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/documents\/([^/]+)\/download/);
    const document_id = match ? match[1] : undefined;
    if (!document_id) {
      return ResponseFactory.validationError('Missing document_id');
    }
    const convex = getConvexClient();
    const document = await convex.query(api.queries.documents.getById, { documentId: document_id as any });
    if (!document || document.userEmail !== payload.email) {
      return ResponseFactory.notFound('Document not found or not owned by chef.');
    }
    // Use document_id for download URL
    const urlResult = await convex.query(api.queries.documents.getPresignedDownloadUrl, { document_id: document_id as any });
    if (!urlResult) {
      return ResponseFactory.notFound('Presigned URL not found.');
    }
    return ResponseFactory.success({ url: urlResult });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to get presigned URL.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
