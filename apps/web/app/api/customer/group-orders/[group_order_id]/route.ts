import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/group-orders/{group_order_id}:
 *   get:
 *     summary: Get Group Order Details
 *     description: Get detailed information about a specific group order
 *     tags: [Customer]
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { group_order_id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const { group_order_id } = params;
    if (!group_order_id) {
      return ResponseFactory.validationError('group_order_id is required.');
    }
    
    const convex = getConvexClient();
    const groupOrder = await convex.query(api.queries.groupOrders.getById, {
      group_order_id,
    });
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    // Check if user has access (creator or participant)
    const hasAccess = groupOrder.created_by === userId ||
      groupOrder.participants.some((p: { user_id: string }) => p.user_id === userId);
    
    if (!hasAccess) {
      return ResponseFactory.forbidden('You do not have access to this group order.');
    }
    
    return ResponseFactory.success(groupOrder, 'Group order retrieved successfully');
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch group order.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

