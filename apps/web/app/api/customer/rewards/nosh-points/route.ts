import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/rewards/nosh-points:
 *   get:
 *     summary: Get Nosh Points
 *     description: Get the user's Nosh Points (coins/rewards points) balance and progress
 *     tags: [Customer, Profile, Rewards]
 *     responses:
 *       200:
 *         description: Nosh Points retrieved successfully
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
 *                     available_points:
 *                       type: number
 *                       description: Currently available coins/points
 *                       example: 1240
 *                     total_points_earned:
 *                       type: number
 *                       description: Lifetime total points earned
 *                       example: 5420
 *                     total_points_spent:
 *                       type: number
 *                       description: Lifetime total points spent
 *                       example: 4180
 *                     progress_percentage:
 *                       type: number
 *                       description: Progress to next coin milestone (0-100)
 *                       example: 40
 *                     progress_to_next_coin:
 *                       type: number
 *                       description: Alternative name for progress_percentage
 *                       example: 40
 *                     next_milestone:
 *                       type: object
 *                       description: Information about next milestone
 *                       properties:
 *                         points_needed:
 *                           type: number
 *                         total_points_required:
 *                           type: number
 *                         reward:
 *                           type: string
 *                     currency:
 *                       type: string
 *                       description: Currency/unit name
 *                       example: "coins"
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get Nosh Points from Convex
    const pointsData = await convex.query(api.queries.noshPoints.getPointsByUserId, {
      userId,
      sessionToken: sessionToken || undefined
    });

    // Calculate milestone progress (next 100-point milestone)
    const availablePoints = pointsData.available_points;
    const milestones = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 3000, 5000];
    const nextMilestone = milestones.find(m => m > availablePoints) || milestones[milestones.length - 1];
    const pointsNeeded = nextMilestone - availablePoints;
    const progressPercentage = nextMilestone > 0 
      ? Math.floor(((availablePoints % nextMilestone) / nextMilestone) * 100)
      : 0;

    return ResponseFactory.success({
      available_points: pointsData.available_points,
      total_points_earned: pointsData.total_points_earned,
      total_points_spent: pointsData.total_points_spent,
      progress_percentage: progressPercentage,
      progress_to_next_coin: progressPercentage,
      next_milestone: {
        points_needed: pointsNeeded,
        total_points_required: nextMilestone,
        reward: 'Bonus Coin',
      },
      currency: 'coins',
      last_updated: pointsData.last_updated || new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch Nosh Points'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

