import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /chef/documents:
 *   get:
 *     summary: Get Chef Documents
 *     description: Retrieve all documents uploaded by the authenticated chef. This endpoint allows chefs to view their uploaded documents including certifications, licenses, and other required paperwork for verification and compliance purposes.
 *     tags: [Chef, Documents]
 *     responses:
 *       200:
 *         description: Chef documents retrieved successfully
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
 *                     documents:
 *                       type: array
 *                       description: Array of chef documents
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Document ID
 *                             example: "j1234567890abcdef"
 *                           chef_id:
 *                             type: string
 *                             description: Chef ID who uploaded the document
 *                             example: "j1234567890abcdef"
 *                           fileName:
 *                             type: string
 *                             description: Original file name
 *                             example: "food_safety_certificate.pdf"
 *                           fileType:
 *                             type: string
 *                             description: File type/category
 *                             example: "certification"
 *                           fileSize:
 *                             type: integer
 *                             description: File size in bytes
 *                             example: 1024000
 *                           contentType:
 *                             type: string
 *                             description: MIME type
 *                             example: "application/pdf"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, expired]
 *                             description: Document review status
 *                             example: "approved"
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Upload timestamp
 *                             example: "2024-01-15T10:00:00.000Z"
 *                           reviewedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Review timestamp
 *                             example: "2024-01-15T14:30:00.000Z"
 *                           reviewedBy:
 *                             type: string
 *                             nullable: true
 *                             description: ID of reviewer
 *                             example: "admin1234567890abcdef"
 *                           reviewNotes:
 *                             type: string
 *                             nullable: true
 *                             description: Review notes from admin
 *                             example: "Document approved, valid until 2025-01-15"
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Document expiration date
 *                             example: "2025-01-15T00:00:00.000Z"
 *                           downloadUrl:
 *                             type: string
 *                             nullable: true
 *                             description: Secure download URL
 *                             example: "https://storage.example.com/download/..."
 *                           metadata:
 *                             type: object
 *                             additionalProperties: true
 *                             nullable: true
 *                             description: Additional document metadata
 *                             example:
 *                               category: "food_safety"
 *                               issuer: "NYC Health Department"
 *                               certificateNumber: "FS-2024-001"
 *                     summary:
 *                       type: object
 *                       description: Document summary statistics
 *                       properties:
 *                         totalDocuments:
 *                           type: integer
 *                           example: 5
 *                         approvedCount:
 *                           type: integer
 *                           example: 4
 *                         pendingCount:
 *                           type: integer
 *                           example: 1
 *                         rejectedCount:
 *                           type: integer
 *                           example: 0
 *                         expiredCount:
 *                           type: integer
 *                           example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - chef role required
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
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    const convex = getConvexClientFromRequest(request);
    const documents = await convex.query(api.queries.documents.getByChefId, { chef_id: userId });
    return ResponseFactory.success({ documents });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 