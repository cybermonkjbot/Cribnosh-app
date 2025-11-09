import { api } from '@/convex/_generated/api';
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
 * /customer/group-orders/{group_order_id}/join:
 *   post:
 *     summary: Join Group Order
 *     description: Join an existing group order with order items
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
    
    const body = await request.json();
    const { order_items, share_token, initial_budget_contribution } = body;
    
    // Order items are now optional (can be added later)
    // Only validate if provided
    if (order_items !== undefined && (!Array.isArray(order_items) || order_items.length === 0)) {
      return ResponseFactory.validationError('order_items must be a non-empty array if provided.');
    }
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get group order
    let groupOrder;
    if (share_token) {
      groupOrder = await convex.query(api.queries.groupOrders.getByShareToken, {
        share_token,
        sessionToken: sessionToken || undefined
      });
    } else {
      groupOrder = await convex.query(api.queries.groupOrders.getById, {
        group_order_id,
        sessionToken: sessionToken || undefined
      });
    }
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    // Join the group order
    const result = await convex.mutation(api.mutations.groupOrders.join, {
      group_order_id: groupOrder._id as any,
      user_id: userId as any,
      order_items: order_items ? order_items.map((item: any) => ({
        dish_id: item.dish_id as any,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        special_instructions: item.special_instructions,
      })) : undefined,
      initial_budget_contribution: initial_budget_contribution || undefined,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success(result, 'Successfully joined group order');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to join group order.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

