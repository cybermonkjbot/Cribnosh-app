import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /customer/account/sessions:
 *   get:
 *     summary: Get Customer Active Sessions
 *     description: Get all active sessions for the current customer
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
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
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           session_id:
 *                             type: string
 *                             description: Session ID
 *                           device:
 *                             type: string
 *                             description: Device name or user agent
 *                           location:
 *                             type: string
 *                             description: IP address or location
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Session creation timestamp
 *                           expires_at:
 *                             type: string
 *                             format: date-time
 *                             description: Session expiration timestamp
 *                           is_current:
 *                             type: boolean
 *                             description: Whether this is the current session
 *       401:
 *         description: Unauthorized - invalid or expired token
 *       403:
 *         description: Forbidden - only customers can access this endpoint
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get sessions from the sessions table
    const sessions = (await convex.query(api.queries.sessions.getSessionsByUserId, {
      userId: userId as any,
      sessionToken: sessionToken || undefined
    })) as any[];

    // Filter active sessions (expiresAt > now)
    const now = Date.now();
    const activeSessions = (sessions || []).filter((session: any) => {
      return session.expiresAt && session.expiresAt > now;
    });

    // Format sessions for response
    const formattedSessions = activeSessions.map((session: any) => {
      // Extract device info from userAgent
      let device = 'Unknown Device';
      if (session.userAgent) {
        // Simple device detection from userAgent
        const ua = session.userAgent.toLowerCase();
        if (ua.includes('iphone') || ua.includes('ipad')) {
          device = 'iOS Device';
        } else if (ua.includes('android')) {
          device = 'Android Device';
        } else if (ua.includes('windows')) {
          device = 'Windows';
        } else if (ua.includes('mac')) {
          device = 'Mac';
        } else if (ua.includes('linux')) {
          device = 'Linux';
        } else {
          device = session.userAgent.substring(0, 50); // Truncate long user agents
        }
      }

      // Determine if this is the current session (compare sessionToken with JWT)
      // Note: We can't directly compare sessionToken with JWT, so we'll mark it based on creation time
      // The most recent session is likely the current one
      const isCurrent = false; // TODO: Implement proper current session detection

      return {
        session_id: session._id,
        device: device,
        location: session.ipAddress || 'Unknown',
        created_at: new Date(session.createdAt).toISOString(),
        expires_at: new Date(session.expiresAt).toISOString(),
        is_current: isCurrent,
      };
    });

    // Sort by creation time (newest first)
    formattedSessions.sort((a: { created_at: string }, b: { created_at: string }) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return ResponseFactory.success({
      sessions: formattedSessions,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('[GET_SESSIONS] Error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch sessions.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

