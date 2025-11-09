import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/group-orders:
 *   post:
 *     summary: Create Group Order
 *     description: Create a new group order that can be shared with others
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chef_id
 *               - restaurant_name
 *             properties:
 *               chef_id:
 *                 type: string
 *                 example: "j1234567890abcdef"
 *               restaurant_name:
 *                 type: string
 *                 example: "Pizza Palace"
 *               title:
 *                 type: string
 *                 example: "Team Lunch from Pizza Palace"
 *               delivery_address:
 *                 type: object
 *               delivery_time:
 *                 type: string
 *               expires_in_hours:
 *                 type: number
 *     responses:
 *       200:
 *         description: Group order created successfully
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const body = await request.json();
    const { chef_id, restaurant_name, initial_budget, title, delivery_address, delivery_time, expires_in_hours } = body;
    
    if (!chef_id || !restaurant_name) {
      return ResponseFactory.validationError('chef_id and restaurant_name are required.');
    }
    
    if (initial_budget === undefined || initial_budget === null || initial_budget <= 0) {
      return ResponseFactory.validationError('initial_budget is required and must be a positive number.');
    }
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const result = await convex.mutation(api.mutations.groupOrders.create, {
      created_by: userId as any,
      chef_id: chef_id as any,
      restaurant_name,
      initial_budget: initial_budget as number,
      title,
      delivery_address,
      delivery_time,
      expires_in_hours,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({
      group_order_id: result.group_order_id,
      share_token: result.share_token,
      share_link: result.share_link,
      expires_at: result.expires_at,
    }, 'Group order created successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create group order.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

