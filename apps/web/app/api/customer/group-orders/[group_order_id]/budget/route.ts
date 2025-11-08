import { api } from '@/convex/_generated/api';
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
 * /customer/group-orders/{group_order_id}/budget:
 *   get:
 *     summary: Get budget details
 *     description: Get budget information including contributions
 *     tags: [Customer]
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
    
    const convex = getConvexClientFromRequest(request);
    const budgetDetails = await convex.query(api.queries.groupOrders.getBudgetContributions, {
      group_order_id,
    });
    
    if (!budgetDetails) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    return ResponseFactory.success(budgetDetails, 'Budget details retrieved successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch budget details.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

