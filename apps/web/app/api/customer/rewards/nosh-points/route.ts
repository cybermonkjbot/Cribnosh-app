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
        'Only customers can access Nosh Points',
        'FORBIDDEN',
        403
      );
    }

    const convex = getConvexClient();
    const userId = payload.user_id as any;

    // Get Nosh Points from Convex
    const pointsData = await convex.query(api.queries.noshPoints.getPointsByUserId, {
      userId,
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
  } catch (error: any) {
    return createSpecErrorResponse(
      error.message || 'Failed to fetch Nosh Points',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

