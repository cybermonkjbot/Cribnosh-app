import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/functions/moderation:
 *   get:
 *     summary: Get moderation functions
 *     description: Get available moderation functions and current moderation status
 *     tags: [Functions]
 *     responses:
 *       200:
 *         description: Moderation functions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     availableFunctions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     activeModerators:
 *                       type: number
 *                     pendingReports:
 *                       type: number
 *                     moderationStats:
 *                       type: object
 *       500:
 *         description: Internal server error
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const convex = getConvexClientFromRequest(request);
    // For now, return mock data until Convex functions are implemented
    return ResponseFactory.success({
      data: {
        availableFunctions: [
          'muteUser',
          'reportUser',
          'banUser',
          'warnUser',
          'timeoutUser',
          'removeContent',
          'escalateReport'
        ],
        activeModerators: 3,
        pendingReports: 12,
        moderationStats: {
          totalActions: 1250,
          actionsToday: 45,
          resolvedReports: 1180,
          averageResponseTime: 2.5
        }
      }
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error in moderation functions:', error);
    return ResponseFactory.error(getErrorMessage(error, 'Failed to retrieve moderation functions'), 'MODERATION_FUNCTIONS_ERROR', 500);
  }
});
