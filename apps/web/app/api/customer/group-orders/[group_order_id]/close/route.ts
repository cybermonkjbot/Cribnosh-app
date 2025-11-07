import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can close group orders.');
    }
    
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
    
    if (groupOrder.created_by !== payload.user_id) {
      return ResponseFactory.forbidden('Only the creator can close the group order.');
    }
    
    const result = await convex.mutation(api.mutations.groupOrders.close, {
      group_order_id: groupOrder._id as Id<'group_orders'>,
      closed_by: payload.user_id as Id<'users'>,
    });
    
    return ResponseFactory.success(result, 'Group order closed successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to close group order.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

