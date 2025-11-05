import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { session_id: string } }
): Promise<NextResponse> {
  try {
    // Authentication
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
      return ResponseFactory.forbidden('Forbidden: Only customers can access this endpoint.');
    }

    const convex = getConvexClient();
    const userId = payload.user_id as Id<'users'>;
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
  } catch (error: any) {
    console.error('[REVOKE_SESSION] Error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to revoke session.');
  }
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

