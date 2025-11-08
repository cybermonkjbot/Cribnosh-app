import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/stats/monthly-overview:
 *   get:
 *     summary: Get Monthly Overview
 *     description: Get monthly statistics including meals logged, calories tracked, and current streak
 *     tags: [Customer, Profile, Statistics]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Specific month to get stats for (YYYY-MM format, default: current month)
 *         example: "2024-01"
 *     responses:
 *       200:
 *         description: Monthly overview retrieved successfully
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
 *                     month:
 *                       type: string
 *                       pattern: '^\d{4}-\d{2}$'
 *                       example: "2024-01"
 *                     period_label:
 *                       type: string
 *                       example: "This Month"
 *                     meals:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: number
 *                         period:
 *                           type: string
 *                     calories:
 *                       type: object
 *                       properties:
 *                         tracked:
 *                           type: number
 *                         period:
 *                           type: string
 *                     streak:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: number
 *                         period:
 *                           type: string
 *                         best_streak:
 *                           type: number
 *                         streak_start_date:
 *                           type: string
 *                           format: date
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
    const monthParam = searchParams.get('month');
    
    let monthStr: string;
    if (monthParam) {
      monthStr = monthParam;
    } else {
      const now = new Date();
      monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const convex = getConvexClientFromRequest(request);

    // Get monthly overview from Convex
    const overviewData = await convex.query(api.queries.stats.getMonthlyOverview, {
      userId,
      month: monthStr,
    });

    return ResponseFactory.success(overviewData);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch monthly overview'),
      'INTERNAL_ERROR',
      500
    );
  }
}


export const GET = withAPIMiddleware(withErrorHandling(handleGET));

