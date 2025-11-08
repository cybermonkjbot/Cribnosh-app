import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /api/notifications/{notification_id}/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read for the authenticated user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Not your notification
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  let notification_id = url.searchParams.get('notification_id') || '';
  // Fallback: parse from pathname /api/notifications/{notification_id}/read
  if (!notification_id) {
    const parts = url.pathname.split('/');
    // e.g., ['', 'api', 'notifications', '{id}', 'read'] → id at length-2
    if (parts.length >= 2) {
      notification_id = parts[parts.length - 2] || '';
    }
  }

  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// notification_id is already extracted from searchParams
    const convex = getConvexClient();
    // Get all notifications and find the one we want
    const notifications = await convex.query(api.queries.notifications.getAll, {});
    const notification = notifications.find((n: { _id: string }) => n._id === notification_id);
    if (!notification) {
      return ResponseFactory.notFound('Notification not found.');
    }
    const userHasRole = notification.roles?.some((role: string) => user.roles?.includes(role)) || false;
    if (notification.userId !== userId && !notification.global && !userHasRole) {
      return ResponseFactory.forbidden('Forbidden: Not your notification.');
    }
    await convex.mutation(api.mutations.notifications.markAsRead, { notificationId: notification_id as Id<'notifications'> });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
