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
): Promise<NextResponse> {
  try {
    await getAuthenticatedCustomer(request);
    
    const notificationId = params.id;
    
    // Handle system/admin notification IDs (they have prefixes)
    if (notificationId.startsWith('system_') || notificationId.startsWith('admin_')) {
      // System/admin notifications don't need to be marked as read via API
      // They're handled differently
      return ResponseFactory.success({ success: true }, 'Notification marked as read');
    }
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Mark notification as read
    await convex.mutation(api.mutations.notifications.markAsRead, {
      notificationId: notificationId as any,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({ success: true }, 'Notification marked as read');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to mark notification as read.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

