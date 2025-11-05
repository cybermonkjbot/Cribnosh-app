import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
      return ResponseFactory.forbidden('Forbidden: Only customers can access group orders.');
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
    
    // Check if user has access (creator or participant)
    const hasAccess = groupOrder.created_by === payload.user_id ||
      groupOrder.participants.some((p: any) => p.user_id === payload.user_id);
    
    if (!hasAccess) {
      return ResponseFactory.forbidden('You do not have access to this group order.');
    }
    
    return ResponseFactory.success(groupOrder, 'Group order retrieved successfully');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch group order.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

