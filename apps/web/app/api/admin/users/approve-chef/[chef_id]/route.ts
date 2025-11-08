import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
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
 *       - cookieAuth: []
 */

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
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
      adminId: userId,
    });
    return ResponseFactory.success({ success: true, chefId: chef_id, status: 'active' });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
