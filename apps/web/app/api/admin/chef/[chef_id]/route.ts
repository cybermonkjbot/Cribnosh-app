// Implements GET for /admin/chef/{chef_id} to fetch all documents for a specific chef
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';

/**
 * @swagger
 * /admin/chef/{chef_id}:
 *   get:
 *     summary: Get Chef Documents (Admin)
 *     description: Retrieve all documents uploaded by a specific chef for administrative review. Only accessible by administrators.
 *     tags: [Admin, Chef Management]
 *     parameters:
 *       - in: path
 *         name: chef_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chef
 *         example: "j1234567890abcdef"
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
 *                       description: Array of documents uploaded by the chef
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Document ID
 *                             example: "j0987654321fedcba"
 *                           title:
 *                             type: string
 *                             description: Document title
 *                             example: "Chef License"
 *                           type:
 *                             type: string
 *                             description: Document type
 *                             example: "license"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, expired]
 *                             description: Document review status
 *                             example: "pending"
 *                           uploadedBy:
 *                             type: string
 *                             description: Chef ID who uploaded the document
 *                             example: "j1234567890abcdef"
 *                           fileUrl:
 *                             type: string
 *                             description: URL to access the document file
 *                             example: "https://storage.example.com/documents/license.pdf"
 *                           fileSize:
 *                             type: number
 *                             description: File size in bytes
 *                             example: 1024000
 *                           mimeType:
 *                             type: string
 *                             description: MIME type of the document
 *                             example: "application/pdf"
 *                           _creationTime:
 *                             type: number
 *                             description: Document upload timestamp
 *                             example: 1640995200000
 *                           lastModified:
 *                             type: number
 *                             description: Last modification timestamp
 *                             example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing chef_id
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

function extractChefIdFromUrl(request: NextRequest): Id<'chefs'> | undefined {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/chef\/([^/]+)/);
  return match ? (match[1] as Id<'chefs'>) : undefined;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const chef_id = extractChefIdFromUrl(request);
    if (!chef_id) {
      return ResponseFactory.validationError('Missing chef_id');
    }
    const convex = getConvexClientFromRequest(request);
    const documents = await convex.query(api.queries.documents.getByChefId, { chef_id: chef_id });
    return ResponseFactory.success({ documents });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
