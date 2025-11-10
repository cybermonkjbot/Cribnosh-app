import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get User Notifications
 *     description: Get paginated list of notifications for the authenticated user
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notifications to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of notifications to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                     notifications:
 *                       type: array
 *                       description: Array of notifications
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Notification ID
 *                             example: "j1234567890abcdef"
 *                           userId:
 *                             type: string
 *                             nullable: true
 *                             description: User ID (null for global notifications)
 *                             example: "j1234567890abcdef"
 *                           type:
 *                             type: string
 *                             description: Notification type
 *                             enum: [info, success, warning, error, order, payment, system]
 *                             example: "order"
 *                           title:
 *                             type: string
 *                             description: Notification title
 *                             example: "Order Confirmed"
 *                           message:
 *                             type: string
 *                             description: Notification message
 *                             example: "Your order #12345 has been confirmed and is being prepared"
 *                           isRead:
 *                             type: boolean
 *                             description: Whether the notification has been read
 *                             example: false
 *                           global:
 *                             type: boolean
 *                             description: Whether this is a global notification
 *                             example: false
 *                           role:
 *                             type: string
 *                             nullable: true
 *                             description: Target role for role-specific notifications
 *                             example: "customer"
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             description: Additional notification data
 *                             example: {"orderId": "j1234567890abcdef", "amount": 25.99}
 *                           createdAt:
 *                             type: number
 *                             description: Notification creation timestamp
 *                             example: 1640995200000
 *                     total:
 *                       type: number
 *                       description: Total number of notifications
 *                       example: 45
 *                     limit:
 *                       type: number
 *                       description: Number of notifications returned
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       description: Number of notifications skipped
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Fetch notifications for this user
    const allNotifications = await convex.query(api.queries.notifications.getAll, {
      sessionToken: sessionToken || undefined
    });
    const userRole = user.roles?.[0];
    type Notification = { userId?: string; global?: boolean; role?: string; createdAt?: number; [key: string]: unknown };
    const userNotifications = allNotifications.filter((n: Notification) => 
      n.userId === userId || n.global || n.role === userRole
    );
    // Consistent ordering (createdAt DESC)
    userNotifications.sort((a: Notification, b: Notification) => (b.createdAt || 0) - (a.createdAt || 0));
    const paginated = userNotifications.slice(offset, offset + limit);
    return ResponseFactory.success({ notifications: paginated, total: userNotifications.length, limit, offset });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications.';
    return ResponseFactory.internalError(message);
  }
}

async function handlePATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    // Mark all notifications as read for this user
    if (!userId) {
      return ResponseFactory.unauthorized('Missing user ID in token.');
    }
    await convex.mutation(api.mutations.notifications.markAllAsRead, { 
      userId: userId as unknown as import('@/convex/_generated/dataModel').Id<"users">,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mark notifications as read.';
    return ResponseFactory.internalError(message);
  }
}

async function handleBulkMarkRead(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const { notification_ids } = await request.json();
    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return ResponseFactory.error('notification_ids array is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    for (const notificationId of notification_ids) {
      await convex.mutation(api.mutations.notifications.markAsRead, {
        notificationId,
        sessionToken: sessionToken || undefined
      });
    }
    return ResponseFactory.success({ success: true, marked: notification_ids.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to bulk mark notifications as read.';
    return ResponseFactory.internalError(message);
  }
}

async function handleExport(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can send notifications.');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const allNotifications = await convex.query(api.queries.notifications.getAll, {
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.jsonDownload(allNotifications, 'notifications-export.json');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export notifications.';
    return ResponseFactory.internalError(message);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
export const BULK_MARK_READ = withAPIMiddleware(withErrorHandling(handleBulkMarkRead));
export const EXPORT = withAPIMiddleware(withErrorHandling(handleExport)); 