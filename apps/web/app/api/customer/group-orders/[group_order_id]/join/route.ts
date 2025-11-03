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
      return ResponseFactory.forbidden('Forbidden: Only customers can join group orders.');
    }
    
    const { group_order_id } = params;
    if (!group_order_id) {
      return ResponseFactory.validationError('group_order_id is required.');
    }
    
    const body = await request.json();
    const { order_items, share_token } = body;
    
    if (!Array.isArray(order_items) || order_items.length === 0) {
      return ResponseFactory.validationError('order_items array is required.');
    }
    
    const convex = getConvexClient();
    
    // Get group order
    let groupOrder;
    if (share_token) {
      groupOrder = await convex.query(api.queries.groupOrders.getByShareToken, {
        share_token,
      });
    } else {
      groupOrder = await convex.query(api.queries.groupOrders.getById, {
        group_order_id,
      });
    }
    
    if (!groupOrder) {
      return ResponseFactory.notFound('Group order not found.');
    }
    
    // Join the group order
    const result = await convex.mutation(api.mutations.groupOrders.join, {
      group_order_id: groupOrder._id as any,
      user_id: payload.user_id as any,
      order_items: order_items.map((item: any) => ({
        dish_id: item.dish_id as any,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        special_instructions: item.special_instructions,
      })),
    });
    
    return ResponseFactory.success(result, 'Successfully joined group order');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to join group order.');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

