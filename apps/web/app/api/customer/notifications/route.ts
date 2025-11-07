import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

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
async function handleGET(request: NextRequest): Promise<NextResponse> {
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
      return ResponseFactory.forbidden('Forbidden: Only customers can access notifications.');
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const convex = getConvexClient();
    
    // Get user notifications
    const userId = payload.user_id || payload.userId || payload.sub;
    if (!userId || typeof userId !== 'string') {
      return ResponseFactory.unauthorized('Invalid user ID in token.');
    }
    
    // Type assertion to avoid deep instantiation issues
    // Using a helper to bypass TypeScript's deep type inference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryFn = api.queries.notifications.getUserNotifications as any;
    const queryArgs: any = {
      userId: userId as any,
      roles: payload.roles || [],
      limit: Math.min(limit, 100),
      unreadOnly,
    };
    // @ts-ignore - Convex type inference can cause deep instantiation issues
    const notifications = await convex.query(queryFn, queryArgs);
    
    return ResponseFactory.success(
      {
        notifications,
        total: notifications.length,
      },
      'Notifications retrieved successfully'
    );
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch notifications.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

