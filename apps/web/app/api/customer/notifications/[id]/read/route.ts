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
 * /customer/notifications/{id}/read:
 *   post:
 *     summary: Mark Notification as Read
 *     description: Mark a specific notification as read
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
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
    
    const notificationId = params.id;
    
    // Handle system/admin notification IDs (they have prefixes)
    if (notificationId.startsWith('system_') || notificationId.startsWith('admin_')) {
      // System/admin notifications don't need to be marked as read via API
      // They're handled differently
      return ResponseFactory.success({ success: true }, 'Notification marked as read');
    }
    
    const convex = getConvexClient();
    
    // Mark notification as read
    await convex.mutation(api.mutations.notifications.markAsRead, {
      notificationId: notificationId as any,
    });
    
    return ResponseFactory.success({ success: true }, 'Notification marked as read');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to mark notification as read.');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

