import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /customer/account/sessions/{session_id}:
 *   delete:
 *     summary: Revoke Customer Session
 *     description: Revoke a specific session for the current customer
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Session revoked successfully"
 *       401:
 *         description: Unauthorized - invalid or expired token
 *       403:
 *         description: Forbidden - only customers can access this endpoint or session does not belong to user
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { session_id: string } }
): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClient();
    const sessionId = params.session_id as Id<'sessions'>;

    // Get session to verify ownership
    const session = await convex.query(api.queries.sessions.getSessionsByUserId, {
      userId: userId,
    });

    const sessionToRevoke = (session || []).find((s: any) => s._id === sessionId);

    if (!sessionToRevoke) {
      return ResponseFactory.notFound('Session not found.');
    }

    // Verify session belongs to user
    if (sessionToRevoke.userId !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only revoke your own sessions.');
    }

    // Delete session via mutation
    const deleted = await convex.mutation(api.mutations.sessions.deleteUserSession, {
      sessionId: sessionId,
    });

    if (!deleted) {
      return ResponseFactory.notFound('Session not found or could not be deleted.');
    }

    return ResponseFactory.success({
      message: 'Session revoked successfully',
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    logger.error('[REVOKE_SESSION] Error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to revoke session.'));
  }
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

