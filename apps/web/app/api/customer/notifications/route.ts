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
 * /customer/notifications:
 *   get:
 *     summary: Get Customer Notifications
 *     description: Fetch user notifications with pagination
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of notifications to return
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
      return ResponseFactory.forbidden('Forbidden: Only customers can access notifications.');
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const convex = getConvexClient();
    
    // Get user notifications
    const notifications = await convex.query(api.queries.notifications.getUserNotifications, {
      userId: payload.user_id as any,
      roles: payload.roles || [],
      limit: Math.min(limit, 100),
      unreadOnly,
    });
    
    return ResponseFactory.success(
      {
        notifications,
        total: notifications.length,
      },
      'Notifications retrieved successfully'
    );
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch notifications.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

