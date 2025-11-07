import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /chef/documents/{document_id}:
 *   get:
 *     summary: Get Chef Document
 *     description: Retrieve a specific document uploaded by the authenticated chef
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
 *                       description: Document information
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Document ID
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           description: Document name
 *                           example: "Food Safety Certificate"
 *                         type:
 *                           type: string
 *                           description: Document type
 *                           example: "food_safety_certificate"
 *                         description:
 *                           type: string
 *                           description: Document description
 *                           example: "Document uploaded by chef: Food Safety Certificate"
 *                         userEmail:
 *                           type: string
 *                           description: Chef's email
 *                           example: "chef@example.com"
 *                         storageId:
 *                           type: string
 *                           description: Storage ID for file access
 *                           example: "storage123456789"
 *                         size:
 *                           type: string
 *                           description: File size
 *                           example: "1024"
 *                         status:
 *                           type: string
 *                           description: Document status
 *                           example: "uploaded"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Creation timestamp
 *                           example: "2024-01-15T10:00:00.000Z"
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
 *         description: Forbidden - only chefs can access documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found or not owned by chef
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
 *   delete:
 *     summary: Delete Chef Document
 *     description: Delete a specific document uploaded by the authenticated chef
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
 *         description: Document deleted successfully
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
 *         description: Forbidden - only chefs can delete documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found or not owned by chef
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
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('chef')) {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access documents.');
    }
    // Extract document_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/documents\/([^/]+)/);
    const document_id = match ? (match[1] as Id<'documents'>) : undefined;
    if (!document_id) {
      return ResponseFactory.validationError('Missing document_id');
    }
    const convex = getConvexClient();
    const document = await convex.query(api.queries.documents.getById, { documentId: document_id });
    if (!document || document.userEmail !== payload.email) {
      return ResponseFactory.notFound('Document not found or not owned by chef.');
    }
    // Ensure storageId is present in the response
    return ResponseFactory.success({ document });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch document.'));
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
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
      return ResponseFactory.forbidden('Forbidden: Only chefs can delete documents.');
    }
    // Extract document_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/documents\/([^/]+)/);
    const document_id = match ? (match[1] as Id<'documents'>) : undefined;
    if (!document_id) {
      return ResponseFactory.validationError('Missing document_id');
    }
    const convex = getConvexClient();
    const document = await convex.query(api.queries.documents.getById, { documentId: document_id });
    if (!document || document.userEmail !== payload.email) {
      return ResponseFactory.notFound('Document not found or not owned by chef.');
    }
    await convex.mutation(api.mutations.documents.deleteDocument, { documentId: document_id });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to delete document.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
