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
async function handlePOST(request: NextRequest): Promise<NextResponse> {
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
      return ResponseFactory.forbidden('Forbidden: Only customers can mark notifications as read.');
    }
    
    const convex = getConvexClient();
    
    // Mark all notifications as read
    await convex.mutation(api.mutations.notifications.markAllAsRead, {
      userId: payload.user_id as any,
    });
    
    return ResponseFactory.success({ success: true }, 'All notifications marked as read');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to mark all notifications as read.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

