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
 * /customer/group-orders/{group_order_id}/budget/chip-in:
 *   post:
 *     summary: Chip into budget
 *     description: Add money to the budget bucket
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
    const { amount } = body;
    
    if (!amount || amount <= 0) {
      return ResponseFactory.validationError('amount must be a positive number.');
    }
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get group order to get the document ID
    const groupOrder = await convex.query(api.queries.groupOrders.getById, {
      group_order_id,
      sessionToken: sessionToken || undefined
    });
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    const result = await convex.mutation(api.mutations.groupOrders.chipInToBudget, {
      group_order_id: groupOrder._id as Id<'group_orders'>,
      user_id: userId as Id<'users'>,
      amount: amount as number,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success(result, 'Budget contribution added successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to chip into budget.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

