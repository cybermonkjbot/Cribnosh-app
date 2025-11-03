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
 * /customer/group-orders:
 *   post:
 *     summary: Create Group Order
 *     description: Create a new group order that can be shared with others
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chef_id
 *               - restaurant_name
 *             properties:
 *               chef_id:
 *                 type: string
 *                 example: "j1234567890abcdef"
 *               restaurant_name:
 *                 type: string
 *                 example: "Pizza Palace"
 *               title:
 *                 type: string
 *                 example: "Team Lunch from Pizza Palace"
 *               delivery_address:
 *                 type: object
 *               delivery_time:
 *                 type: string
 *               expires_in_hours:
 *                 type: number
 *     responses:
 *       200:
 *         description: Group order created successfully
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
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
      return ResponseFactory.forbidden('Forbidden: Only customers can create group orders.');
    }
    
    const body = await request.json();
    const { chef_id, restaurant_name, title, delivery_address, delivery_time, expires_in_hours } = body;
    
    if (!chef_id || !restaurant_name) {
      return ResponseFactory.validationError('chef_id and restaurant_name are required.');
    }
    
    const convex = getConvexClient();
    const result = await convex.mutation(api.mutations.groupOrders.create, {
      created_by: payload.user_id as any,
      chef_id: chef_id as any,
      restaurant_name,
      title,
      delivery_address,
      delivery_time,
      expires_in_hours,
    });
    
    return ResponseFactory.success({
      group_order_id: result.group_order_id,
      share_token: result.share_token,
      share_link: result.share_link,
      expires_at: result.expires_at,
    }, 'Group order created successfully');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to create group order.');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

