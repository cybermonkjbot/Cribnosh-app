import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/stats/weekly-summary:
 *   get:
 *     summary: Get Weekly Summary
 *     description: Get weekly statistics for bragging cards including meals per day, calorie comparisons, and cuisines explored
 *     tags: [Customer, Profile, Statistics]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for week (default: 7 days ago)
 *         example: "2024-01-08"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for week (default: today)
 *         example: "2024-01-14"
 *     responses:
 *       200:
 *         description: Weekly summary retrieved successfully
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
 *                     week_start:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-08"
 *                     week_end:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-14"
 *                     week_meals:
 *                       type: array
 *                       description: Array of 7 numbers representing meals per day (Monday to Sunday)
 *                       items:
 *                         type: number
 *                       example: [2, 3, 4, 3, 5, 1, 2]
 *                     avg_meals:
 *                       type: number
 *                       description: Average meals per day (rounded to 1 decimal)
 *                       example: 2.9
 *                     kcal_today:
 *                       type: number
 *                       description: Calories consumed today
 *                       example: 1420
 *                     kcal_yesterday:
 *                       type: number
 *                       description: Calories consumed yesterday
 *                       example: 1680
 *                     cuisines:
 *                       type: array
 *                       description: Array of unique cuisine names explored this week
 *                       items:
 *                         type: string
 *                       example: ["Nigerian", "Italian", "Asian Fusion"]
 *                     daily_calories:
 *                       type: array
 *                       description: Detailed daily calorie breakdown
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           kcal:
 *                             type: number
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
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can access weekly summary',
        'FORBIDDEN',
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    
    let endDate: Date;
    let startDate: Date;
    
    if (endDateParam) {
      endDate = new Date(endDateParam);
    } else {
      endDate = new Date();
    }
    endDate.setHours(23, 59, 59, 999);
    
    if (startDateParam) {
      startDate = new Date(startDateParam);
    } else {
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6); // 7 days ago
    }
    startDate.setHours(0, 0, 0, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Get weekly summary from Convex
    const summaryData = await convex.query(api.queries.stats.getWeeklySummary, {
      userId,
      startDate: startDateStr,
      endDate: endDateStr,
    });

    return ResponseFactory.success(summaryData);
  } catch (error: unknown) {
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch weekly summary'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

