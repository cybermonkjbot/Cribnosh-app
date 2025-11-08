import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /admin/users/reject-chef/{chef_id}:
 *   post:
 *     summary: Reject Chef Application (Admin)
 *     description: Reject a chef application and deactivate their account. This endpoint changes the chef's status to 'inactive' and prevents them from accepting orders.
 *     tags: [Admin, Chef Management]
 *     parameters:
 *       - in: path
 *         name: chef_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chef to reject
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Chef rejected successfully
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
 *                     first_name:
 *                       type: string
 *                       description: Chef's first name
 *                       example: "John"
 *                     last_name:
 *                       type: string
 *                       description: Chef's last name
 *                       example: "Doe"
 *                     profile_id:
 *                       type: string
 *                       description: Chef profile ID
 *                       example: "j1234567890abcdef"
 *                     user_id:
 *                       type: string
 *                       description: User ID
 *                       example: "j1234567890abcdef"
 *                     is_approved:
 *                       type: boolean
 *                       description: Approval status
 *                       example: false
 *                     status:
 *                       type: string
 *                       description: Chef status
 *                       example: "rejected"
 *                     avg_rating:
 *                       type: number
 *                       description: Average rating
 *                       example: 0
 *                     total_reviews:
 *                       type: number
 *                       description: Total number of reviews
 *                       example: 0
 *                     total_orders:
 *                       type: number
 *                       description: Total number of orders
 *                       example: 0
 *                     is_available:
 *                       type: boolean
 *                       description: Availability status
 *                       example: false
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Account creation date
 *                       example: "2024-01-15T10:30:00Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Last update date
 *                       example: "2024-01-15T10:30:00Z"
 *                     profile_image_url:
 *                       type: string
 *                       nullable: true
 *                       description: Profile image URL
 *                       example: "https://example.com/avatar.jpg"
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
 *         description: Forbidden - only admins can reject chefs
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
  // Extract chef_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/reject-chef\/([^/]+)/);
  const chef_id = match ? match[1] : undefined;
  if (!chef_id) {
    return ResponseFactory.validationError('Missing chef_id');
  }
  const convex = getConvexClientFromRequest(request);
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const userId = chef_id as Id<'users'>;
    await convex.mutation(api.mutations.users.updateUser, { userId, status: 'inactive', roles: ['chef'] });
    const chef = await convex.query(api.queries.users.getById, { userId });
    if (!chef) {
      return ResponseFactory.notFound('Chef not found');
    }
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'reject_chef',
      details: { chef_id },
      adminId: userId,
    });
    // Compose ChefProfileResponse (minimal)
    const [first_name, ...rest] = (chef.name || '').split(' ');
    const last_name = rest.join(' ');
    return ResponseFactory.success({
      first_name: first_name || '',
      last_name: last_name || '',
      profile_id: chef._id,
      user_id: chef._id,
      is_approved: false,
      status: 'rejected',
      avg_rating: 0, // 'rating' does not exist on users, so default to 0
      total_reviews: 0,
      total_orders: 0,
      is_available: false,
      created_at: new Date(chef._creationTime).toISOString(), // Use _creationTime instead of createdAt
      updated_at: new Date(chef.lastModified || Date.now()).toISOString(),
      profile_image_url: chef.avatar || null,
    });
  } catch (e: unknown) {
    if (isAuthenticationError(e) || isAuthorizationError(e)) {
      return handleConvexError(e, request);
    }
    return ResponseFactory.internalError(getErrorMessage(e, 'Failed to reject chef'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
