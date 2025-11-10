import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

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
    const { userId, user } = await getAuthenticatedCustomer(request);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const convex = getConvexClientFromRequest(request);
    
    // Type assertion to avoid deep instantiation issues
    // Using a helper to bypass TypeScript's deep type inference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryFn = api.queries.notifications.getUserNotifications as any;
    const queryArgs: any = {
      userId: userId as any,
      roles: user.roles || [],
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
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch notifications.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

