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
      return ResponseFactory.forbidden('Forbidden: Only customers can access notification stats.');
    }
    
    const convex = getConvexClient();
    
    // Get notification stats
    const stats = await convex.query(api.queries.notifications.getNotificationStats, {
      userId: payload.user_id as any,
      roles: payload.roles || [],
    });
    
    return ResponseFactory.success(stats, 'Stats retrieved successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch notification stats.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

