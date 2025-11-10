import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

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
    const { userId, user } = await getAuthenticatedCustomer(request);
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get notification stats
    const stats = await convex.query(api.queries.notifications.getNotificationStats, {
      userId: userId as any,
      roles: user.roles || [],
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success(stats, 'Stats retrieved successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch notification stats.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

