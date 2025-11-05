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
 * /chef/documents/upload:
 *   post:
 *     summary: Upload Chef Document
 *     description: Upload a document for chef verification or compliance
 *     tags: [Chef, Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - document_type
 *               - storageId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the document
 *                 example: "Food Safety Certificate"
 *               document_type:
 *                 type: string
 *                 description: Type of document being uploaded
 *                 example: "food_safety_certificate"
 *               storageId:
 *                 type: string
 *                 description: Storage ID from file upload
 *                 example: "storage123456789"
 *     responses:
 *       200:
 *         description: Document uploaded successfully
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
 *                     document_id:
 *                       type: string
 *                       description: ID of the uploaded document
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
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
 *         description: Forbidden - only chefs can upload documents
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
    if (payload.role !== 'chef') {
      return ResponseFactory.forbidden('Forbidden: Only chefs can upload documents.');
    }
    const { name, document_type, storageId } = await request.json();
    if (!name || !document_type || !storageId) {
      return ResponseFactory.validationError('Missing required fields.');
    }
    const convex = getConvexClient();
    const document_id = await convex.mutation(api.mutations.documents.uploadDocument, {
      userEmail: payload.email,
      name,
      type: document_type,
      description: `Document uploaded by chef: ${name}`,
      size: '0', // Size will be determined by the file
      storageId,
    });
    return ResponseFactory.success({ success: true, document_id });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to upload document.' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 