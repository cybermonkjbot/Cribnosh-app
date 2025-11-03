import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createSpecErrorResponse(
        'Invalid or missing token',
        'UNAUTHORIZED',
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can access calories progress',
        'FORBIDDEN',
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam 
      ? new Date(dateParam)
      : new Date();
    
    const dateStr = targetDate.toISOString().split('T')[0];

    const convex = getConvexClient();
    const userId = payload.user_id as any;

    // Get calories progress from Convex
    const progressData = await convex.query(api.queries.nutrition.getCaloriesProgress, {
      userId,
      date: dateStr,
    });

    return ResponseFactory.success(progressData);
  } catch (error: any) {
    return createSpecErrorResponse(
      error.message || 'Failed to fetch calories progress',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

