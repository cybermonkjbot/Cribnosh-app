import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /admin/chef/cuisines/{cuisine_id}/approve:
 *   post:
 *     summary: Approve Chef Cuisine (Admin)
 *     description: Approve a chef's cuisine specialization. This endpoint changes the cuisine status to 'approved' and allows the chef to offer dishes in this cuisine category.
 *     tags: [Admin, Chef Management, Cuisines]
 *     parameters:
 *       - in: path
 *         name: cuisine_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chef cuisine to approve
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Chef cuisine approved successfully
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
 *                   description: Empty object indicating successful approval
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing cuisine_id
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
 *     security: []
 *   put:
 *     summary: Update Chef Cuisine Status (Admin)
 *     description: Update the approval status of a chef's cuisine specialization. Can be set to 'approved' or 'rejected'.
 *     tags: [Admin, Chef Management, Cuisines]
 *     parameters:
 *       - in: path
 *         name: cuisine_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chef cuisine to update
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: New status for the chef cuisine
 *                 example: "approved"
 *     responses:
 *       200:
 *         description: Chef cuisine status updated successfully
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
 *                   description: Empty object indicating successful update
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing cuisine_id or invalid status
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
 *     security: []
 */

export async function POST(request: NextRequest, { params }: { params: { cuisine_id: string } }): Promise<NextResponse> {
  const { cuisine_id } = params;
  if (!cuisine_id) {
    return ResponseFactory.validationError('Missing cuisine_id');
  }
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  try {
    await convex.mutation(api.mutations.chefs.updateCuisine, {
      cuisineId: cuisine_id as Id<'cuisines'>,
      status: 'approved',
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({});
  } catch (e: unknown) {
    return ResponseFactory.internalError(e instanceof Error ? e.message : 'Failed to approve cuisine' );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { cuisine_id: string } }): Promise<NextResponse> {
  const { cuisine_id } = params;
  if (!cuisine_id) {
    return ResponseFactory.validationError('Missing cuisine_id');
  }
  const { status } = await request.json();
  if (!status || (status !== 'approved' && status !== 'rejected')) {
    return ResponseFactory.validationError('Invalid status');
  }
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  try {
    await convex.mutation(api.mutations.chefs.updateCuisine, {
      cuisineId: cuisine_id as Id<'cuisines'>,
      status,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({});
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update cuisine status';
    return ResponseFactory.internalError(errorMessage);
  }
}
