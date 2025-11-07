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
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /api/chef/documents/status:
 *   get:
 *     summary: Get chef document status
 *     description: Retrieve the overall status of chef documents (chef only)
 *     tags: [Chef Documents]
 *     security:
 *       - bearerAuth: []
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
      return ResponseFactory.forbidden('Forbidden: Only chefs can access document status.');
    }
    const convex = getConvexClient();
    const documents = await convex.query(api.queries.documents.getByChefId, { chef_id: payload.user_id });
    let status = 'pending';
    if (documents.length > 0) {
      if (documents.every((d: { status?: string }) => d.status === 'approved')) status = 'approved';
      else if (documents.some((d: { status?: string }) => d.status === 'rejected')) status = 'rejected';
      else if (documents.some((d: { status?: string }) => d.status === 'pending')) status = 'pending';
      else status = 'unknown';
    }
    return ResponseFactory.success({ status });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch document status.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 