import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get Unread Notification Count
 *     description: Retrieve the count of unread notifications for the authenticated user. This endpoint provides a quick way to check notification status without fetching all notification details, useful for badge counts and UI indicators.
 *     tags: [Notifications, Count]
 *     responses:
 *       200:
 *         description: Unread notification count retrieved successfully
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
 *                     unread_count:
 *                       type: integer
 *                       description: Number of unread notifications
 *                       example: 5
 *                     breakdown:
 *                       type: object
 *                       nullable: true
 *                       description: Breakdown of unread notifications by type
 *                       properties:
 *                         order_updates:
 *                           type: integer
 *                           example: 2
 *                         system_alerts:
 *                           type: integer
 *                           example: 1
 *                         promotional:
 *                           type: integer
 *                           example: 1
 *                         chat_messages:
 *                           type: integer
 *                           example: 1
 *                     last_checked:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Last time user checked notifications
 *                       example: "2024-01-15T10:30:00Z"
 *                     has_urgent:
 *                       type: boolean
 *                       description: Whether there are any urgent notifications
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
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
    
    const convex = getConvexClient();
    const notifications = await convex.query(api.queries.notifications.getAll, {});
    const userHasRole = (notificationRoles: string[] = []) => 
      notificationRoles.some(role => user.roles?.includes(role));
    
    const unread = notifications.filter((n: any) => 
      (n.userId === userId || 
       n.global || 
       userHasRole(n.roles)) && 
      !n.read
    );
    
    return ResponseFactory.success({ unread_count: unread.length });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 