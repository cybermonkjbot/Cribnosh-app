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
      return ResponseFactory.forbidden('Forbidden: Only customers can chip into budget.');
    }
    
    const { group_order_id } = params;
    if (!group_order_id) {
      return ResponseFactory.validationError('group_order_id is required.');
    }
    
    const body = await request.json();
    const { amount } = body;
    
    if (!amount || amount <= 0) {
      return ResponseFactory.validationError('amount must be a positive number.');
    }
    
    const convex = getConvexClient();
    
    // Get group order to get the document ID
    const groupOrder = await convex.query(api.queries.groupOrders.getById, {
      group_order_id,
    });
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    const result = await convex.mutation(api.mutations.groupOrders.chipInToBudget, {
      group_order_id: groupOrder._id as Id<'group_orders'>,
      user_id: payload.user_id as Id<'users'>,
      amount: amount as number,
    });
    
    return ResponseFactory.success(result, 'Budget contribution added successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to chip into budget.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

