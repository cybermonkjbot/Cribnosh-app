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

/**
 * @swagger
 * /admin/users/approve-chef/{chef_id}:
 *   post:
 *     summary: Approve Chef Application (Admin)
 *     description: Approve a chef application and activate their account. This endpoint changes the chef's status to 'active' and allows them to start accepting orders.
 *     tags: [Admin, Chef Management]
 *     parameters:
 *       - in: path
 *         name: chef_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chef to approve
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Chef approved successfully
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
 *                     chefId:
 *                       type: string
 *                       description: ID of the approved chef
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       description: New chef status
 *                       example: "active"
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
 *         description: Forbidden - only admins can approve chefs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef not found
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

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

async function handlePOST(request: NextRequest): Promise<NextResponse> {
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
    if (!payload.roles?.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const url = new URL(request.url);
    const match = url.pathname.match(/approve-chef\/([^/]+)/);
    const chef_id = match ? match[1] as Id<'chefs'> : undefined;
    if (!chef_id) {
      return ResponseFactory.validationError('Missing chef_id');
    }
    const convex = getConvexClient();
    // Fetch chef by ID
    const chef = await convex.query(api.queries.chefs.getChefById, { chefId: chef_id });
    if (!chef) {
      return ResponseFactory.notFound('Chef not found.');
    }
    // Update chef status to 'active' using the database patch method
    await convex.mutation(api.mutations.chefs.updateChef, {
      chefId: chef._id,
      status: 'active'
    });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'approve_chef',
      details: { chef_id: chef._id },
      adminId: payload.user_id,
    });
    return ResponseFactory.success({ success: true, chefId: chef_id, status: 'active' });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to approve chef.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
