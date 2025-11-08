import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /customer/forkprint/score:
 *   get:
 *     summary: Get ForkPrint Score
 *     description: Get the user's ForkPrint score, current level/status, and progress to next level
 *     tags: [Customer, Profile]
 *     responses:
 *       200:
 *         description: ForkPrint score retrieved successfully
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
 *                     score:
 *                       type: number
 *                       description: Current ForkPrint score
 *                       example: 799
 *                     status:
 *                       type: string
 *                       description: Current level/status name
 *                       example: "Tastemaker"
 *                     points_to_next:
 *                       type: number
 *                       description: Points needed to reach next level
 *                       example: 3
 *                     next_level:
 *                       type: string
 *                       description: Name of next level
 *                       example: "Food Influencer"
 *                     current_level_icon:
 *                       type: string
 *                       nullable: true
 *                       description: Icon identifier for current level
 *                     level_history:
 *                       type: array
 *                       description: Array of levels unlocked with timestamps
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: string
 *                           unlocked_at:
 *                             type: string
 *                             format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: ForkPrint score not found for this user
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Get ForkPrint score from Convex
    let forkPrintData = await convex.query(api.queries.forkPrint.getScoreByUserId, {
      userId,
    });

    // If no score exists, create a default one
    if (!forkPrintData) {
      try {
        // Initialize with 0 score (Starter level)
        await convex.mutation(api.mutations.forkPrint.updateScore, {
          userId,
          pointsDelta: 0, // This will create the record with score 0
        });

        // Fetch the newly created score
        forkPrintData = await convex.query(api.queries.forkPrint.getScoreByUserId, {
          userId,
        });
      } catch (mutationError) {
        logger.error('Failed to create default ForkPrint score:', mutationError);
        // If mutation fails, return default values
        forkPrintData = null;
      }

      // If still null after creation attempt, return default values
      if (!forkPrintData) {
        const now = new Date().toISOString();
        return ResponseFactory.success({
          score: 0,
          status: 'Starter',
          points_to_next: 100,
          next_level: 'Tastemaker',
          current_level_icon: null,
          level_history: [],
          updated_at: now,
        });
      }
    }

    return ResponseFactory.success({
      score: forkPrintData.score,
      status: forkPrintData.status,
      points_to_next: forkPrintData.points_to_next,
      next_level: forkPrintData.next_level,
      current_level_icon: forkPrintData.current_level_icon,
      level_history: forkPrintData.level_history,
      updated_at: forkPrintData.updated_at,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch ForkPrint score'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

