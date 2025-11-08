// Implements GET for /admin/{document_id} to fetch a specific document for admin review
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/{document_id}:
 *   get:
 *     summary: Get Document by ID (Admin)
 *     description: Retrieve detailed information about a specific document for administrative review. Only accessible by administrators.
 *     tags: [Admin, Document Management]
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the document
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Document retrieved successfully
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
 *                     document:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Document ID
 *                           example: "j1234567890abcdef"
 *                         title:
 *                           type: string
 *                           description: Document title
 *                           example: "Chef License Document"
 *                         type:
 *                           type: string
 *                           description: Document type
 *                           example: "license"
 *                         status:
 *                           type: string
 *                           enum: [pending, approved, rejected, expired]
 *                           description: Document review status
 *                           example: "pending"
 *                         uploadedBy:
 *                           type: string
 *                           description: User ID who uploaded the document
 *                           example: "j0987654321fedcba"
 *                         fileUrl:
 *                           type: string
 *                           description: URL to access the document file
 *                           example: "https://storage.example.com/documents/doc123.pdf"
 *                         fileSize:
 *                           type: number
 *                           description: File size in bytes
 *                           example: 1024000
 *                         mimeType:
 *                           type: string
 *                           description: MIME type of the document
 *                           example: "application/pdf"
 *                         _creationTime:
 *                           type: number
 *                           description: Document upload timestamp
 *                           example: 1640995200000
 *                         lastModified:
 *                           type: number
 *                           description: Last modification timestamp
 *                           example: 1640995200000
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
 *         description: Document not found
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
  const match = url.pathname.match(/\/admin\/([^/]+)/);
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
    const convex = getConvexClient();
    const document = await convex.query(api.queries.documents.getById, { documentId: document_id });
    if (!document) {
      return ResponseFactory.notFound('Document not found.');
    }
    return ResponseFactory.success({ document });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));