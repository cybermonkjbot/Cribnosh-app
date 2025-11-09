import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

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
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId, user } = await getAuthenticatedChef(request);
    const { name, document_type, storageId } = await request.json();
    if (!name || !document_type || !storageId) {
      return ResponseFactory.validationError('Missing required fields.');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const document_id = await convex.mutation(api.mutations.documents.uploadDocument, {
      userEmail: user.email || '',
      name,
      type: document_type,
      description: `Document uploaded by chef: ${name}`,
      size: '0', // Size will be determined by the file
      storageId,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true, document_id });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 