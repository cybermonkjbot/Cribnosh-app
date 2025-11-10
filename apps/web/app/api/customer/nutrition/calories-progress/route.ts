import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/nutrition/calories-progress:
 *   get:
 *     summary: Get Calories Progress
 *     description: Get the user's daily calorie consumption progress and goals
 *     tags: [Customer, Profile, Nutrition]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date to get progress for (default: today)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Calories progress retrieved successfully
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
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-15"
 *                     consumed:
 *                       type: number
 *                       description: Total calories consumed
 *                       example: 1845
 *                     goal:
 *                       type: number
 *                       description: Daily calorie goal
 *                       example: 2000
 *                     remaining:
 *                       type: number
 *                       description: Calories remaining to reach goal
 *                       example: 155
 *                     progress_percentage:
 *                       type: number
 *                       description: Progress percentage (0-100, can exceed 100)
 *                       example: 92
 *                     goal_type:
 *                       type: string
 *                       description: Type of goal
 *                       example: "daily"
 *                     breakdown:
 *                       type: object
 *                       description: Calorie breakdown by meal type
 *                       properties:
 *                         breakfast:
 *                           type: number
 *                         lunch:
 *                           type: number
 *                         dinner:
 *                           type: number
 *                         snacks:
 *                           type: number
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam 
      ? new Date(dateParam)
      : new Date();
    
    const dateStr = targetDate.toISOString().split('T')[0];

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get calories progress from Convex
    const progressData = await convex.query(api.queries.nutrition.getCaloriesProgress, {
      userId,
      date: dateStr,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(progressData);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch calories progress'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

