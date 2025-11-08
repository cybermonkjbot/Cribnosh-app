import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/group-orders/{group_order_id}/selections:
 *   get:
 *     summary: Get all selections
 *     description: Get all participants' selections
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Optional user_id to get specific participant's selections
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { group_order_id: string } }
): Promise<NextResponse> {
  try {
    await getAuthenticatedCustomer(request);
    
    const { group_order_id } = params;
    if (!group_order_id) {
      return ResponseFactory.validationError('group_order_id is required.');
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    const convex = getConvexClientFromRequest(request);
    const selections = await convex.query(api.queries.groupOrders.getParticipantSelections, {
      group_order_id,
      participant_user_id: userId ? (userId as Id<'users'>) : undefined,
    });
    
    if (!selections) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    return ResponseFactory.success(selections, 'Selections retrieved successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch selections.'));
  }
}

/**
 * @swagger
 * /customer/group-orders/{group_order_id}/selections:
 *   post:
 *     summary: Update participant's selections
 *     description: Update or set participant's order items
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
    const { order_items } = body;
    
    if (!Array.isArray(order_items)) {
      return ResponseFactory.validationError('order_items must be an array.');
    }
    
    const convex = getConvexClientFromRequest(request);
    
    // Get group order to get the document ID
    const groupOrder = await convex.query(api.queries.groupOrders.getById, {
      group_order_id,
    });
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    const result = await convex.mutation(api.mutations.groupOrders.updateParticipantSelections, {
      group_order_id: groupOrder._id as Id<'group_orders'>,
      user_id: userId as Id<'users'>,
      order_items: order_items.map((item: any) => ({
        dish_id: item.dish_id as Id<'meals'>,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        special_instructions: item.special_instructions,
      })),
    });
    
    return ResponseFactory.success(result, 'Selections updated successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update selections.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

