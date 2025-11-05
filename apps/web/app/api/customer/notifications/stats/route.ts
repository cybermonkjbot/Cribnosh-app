import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getConvexClient } from '@/lib/convex';
import { api } from '@repo/convex';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/apiMiddleware';
import { withErrorHandling } from '@/lib/errors';

const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * @swagger
 * /customer/notifications/stats:
 *   get:
 *     summary: Get Notification Stats
 *     description: Get unread count and notification statistics
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<Response> {
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
      return ResponseFactory.forbidden('Forbidden: Only customers can access notification stats.');
    }
    
    const convex = getConvexClient();
    
    // Get notification stats
    const stats = await convex.query(api.queries.notifications.getNotificationStats, {
      userId: payload.user_id as any,
      roles: payload.roles || [],
    });
    
    return ResponseFactory.success(stats, 'Stats retrieved successfully');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch notification stats.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

