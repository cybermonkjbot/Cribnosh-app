import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/apiMiddleware';
import { getConvexClient } from '@/lib/convex';
import { withErrorHandling } from '@/lib/errors';
import { api } from '@repo/convex';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * @swagger
 * /customer/notifications/read-all:
 *   post:
 *     summary: Mark All Notifications as Read
 *     description: Mark all user notifications as read
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest): Promise<Response> {
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
      return ResponseFactory.forbidden('Forbidden: Only customers can mark notifications as read.');
    }
    
    const convex = getConvexClient();
    
    // Mark all notifications as read
    await convex.mutation(api.mutations.notifications.markAllAsRead, {
      userId: payload.user_id as any,
    });
    
    return ResponseFactory.success({ success: true }, 'All notifications marked as read');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to mark all notifications as read.');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

