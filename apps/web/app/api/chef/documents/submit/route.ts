import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /chef/documents/submit:
 *   post:
 *     summary: Submit Documents for Review
 *     description: Submit uploaded documents for admin review and approval
 *     tags: [Chef, Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document_ids
 *             properties:
 *               document_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs to submit for review
 *                 example: ["j1234567890abcdef", "j0987654321fedcba"]
 *     responses:
 *       200:
 *         description: Documents submitted for review successfully
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
 *                     message:
 *                       type: string
 *                       example: "Documents submitted for review"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - no document IDs provided
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
 *         description: Forbidden - only chefs can submit documents
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
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);
    const { document_ids } = await request.json();
    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return ResponseFactory.validationError('No document IDs provided.');
    }
    const convex = getConvexClient();
    
    // Validate that all documents belong to the authenticated chef
    const documents = await Promise.all(
      document_ids.map(async (docId) => {
        const document = await convex.query(api.queries.documents.getById, { documentId: docId });
        if (!document) {
          throw new Error(`Document ${docId} not found`);
        }
        if (document.userEmail !== user.email) {
          throw new Error(`Document ${docId} does not belong to authenticated user`);
        }
        if (document.status !== 'uploaded') {
          throw new Error(`Document ${docId} is not in uploaded status`);
        }
        return document;
      })
    );

    // Update all documents to pending_review status
    await Promise.all(
      document_ids.map(async (docId) => {
        await convex.mutation(api.mutations.documents.updateDocumentStatus, {
          documentId: docId,
          status: 'pending_review',
          updatedAt: new Date().toISOString()
        });
      })
    );

    // Log the submission for admin review
    await convex.mutation(api.mutations.admin.logActivity, {
      type: 'document_submission',
      userId: userId,
      description: `Chef submitted ${document_ids.length} documents for review`,
      metadata: {
        entityType: 'document_submission',
        details: {
          documentIds: document_ids,
          chefEmail: user.email,
          submissionTime: new Date().toISOString()
        }
      }
    });

    console.log(`Chef ${userId} submitted documents for review:`, document_ids);
    
    return ResponseFactory.success({ 
      success: true, 
      message: `${document_ids.length} documents submitted for review successfully`,
      documentCount: document_ids.length
    });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 