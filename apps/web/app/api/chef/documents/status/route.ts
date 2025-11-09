/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [pending, approved, rejected, unknown]
 *               description: Overall status of chef documents
 *         message:
 *           type: string
 *           example: "Success"
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';

/**
 * @swagger
 * /api/chef/documents/status:
 *   get:
 *     summary: Get chef document status
 *     description: Retrieve the overall status of chef documents (chef only)
 *     tags: [Chef Documents]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Document status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentStatusResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Chef access required
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    const documents = await convex.query(api.queries.documents.getByChefId, {
      chef_id: userId,
      sessionToken: sessionToken || undefined
    });
    let status = 'pending';
    if (documents.length > 0) {
      if (documents.every((d: { status?: string }) => d.status === 'approved')) status = 'approved';
      else if (documents.some((d: { status?: string }) => d.status === 'rejected')) status = 'rejected';
      else if (documents.some((d: { status?: string }) => d.status === 'pending')) status = 'pending';
      else status = 'unknown';
    }
    return ResponseFactory.success({ status });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 