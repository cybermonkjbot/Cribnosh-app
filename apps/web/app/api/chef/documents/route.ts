import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
      return ResponseFactory.forbidden('Forbidden: Only chefs can access their documents.');
    }
    const convex = getConvexClient();
    const documents = await convex.query(api.queries.documents.getByChefId, { chef_id: payload.user_id });
    return ResponseFactory.success({ documents });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch documents.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 