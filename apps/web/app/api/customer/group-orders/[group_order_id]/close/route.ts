import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/group-orders/{group_order_id}/close:
 *   post:
 *     summary: Close Group Order
 *     description: Close the group order and convert to regular order
 *     tags: [Customer]
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { group_order_id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const { group_order_id } = params;
    if (!group_order_id) {
      return ResponseFactory.validationError('group_order_id is required.');
    }
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const groupOrder = await convex.query(api.queries.groupOrders.getById, {
      group_order_id,
      sessionToken: sessionToken || undefined
    });
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    if (groupOrder.created_by !== userId) {
      return ResponseFactory.forbidden('Only the creator can close the group order.');
    }
    
    const result = await convex.mutation(api.mutations.groupOrders.close, {
      group_order_id: groupOrder._id as Id<'group_orders'>,
      closed_by: userId as Id<'users'>,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success(result, 'Group order closed successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to close group order.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

