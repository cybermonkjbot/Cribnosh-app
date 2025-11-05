import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/group-orders/{group_order_id}/ready:
 *   post:
 *     summary: Mark selections as ready
 *     description: Mark participant's selections as ready (swipe to complete)
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
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can mark selections as ready.');
    }
    
    const { group_order_id } = params;
    if (!group_order_id) {
      return ResponseFactory.validationError('group_order_id is required.');
    }
    
    const convex = getConvexClient();
    
    // Get group order to get the document ID
    const groupOrder = await convex.query(api.queries.groupOrders.getById, {
      group_order_id,
    });
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    const result = await convex.mutation(api.mutations.groupOrders.markSelectionsReady, {
      group_order_id: groupOrder._id as Id<'group_orders'>,
      user_id: payload.user_id as Id<'users'>,
    });
    
    return ResponseFactory.success(result, 'Selections marked as ready successfully');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to mark selections as ready.');
  }
}

/**
 * @swagger
 * /customer/group-orders/{group_order_id}/ready-status:
 *   get:
 *     summary: Get ready status
 *     description: Get ready status of all participants
 *     tags: [Customer]
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { group_order_id: string } }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access ready status.');
    }
    
    const { group_order_id } = params;
    if (!group_order_id) {
      return ResponseFactory.validationError('group_order_id is required.');
    }
    
    const convex = getConvexClient();
    const status = await convex.query(api.queries.groupOrders.getGroupOrderStatus, {
      group_order_id,
    });
    
    if (!status) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    return ResponseFactory.success(status, 'Ready status retrieved successfully');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch ready status.');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET));

