import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

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
    const { userId } = await getAuthenticatedCustomer(request);
    
    const convex = getConvexClient();
    
    // Mark all notifications as read
    await convex.mutation(api.mutations.notifications.markAllAsRead, {
      userId: userId as any,
    });
    
    return ResponseFactory.success({ success: true }, 'All notifications marked as read');
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to mark all notifications as read.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

